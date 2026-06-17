use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::process::Command;

const NEWS_HUB_URL: &str = "https://www.minecraft.net/en-us/article";
const NEWS_SEARCH_URL: &str =
    "https://net-secondary.web.minecraft-services.net/api/v1.0/en-us/search";
const NEWS_BASE_URL: &str = "https://www.minecraft.net";
const UA: &str = "Refract/1.1.3 (Minecraft news)";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MinecraftNewsItem {
    pub title: String,
    pub summary: String,
    pub image_url: Option<String>,
    pub url: String,
    pub published_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct MinecraftSearchResponse {
    result: Option<MinecraftSearchResult>,
}

#[derive(Debug, Deserialize)]
struct MinecraftSearchResult {
    results: Option<Vec<MinecraftSearchEntry>>,
}

#[derive(Debug, Deserialize)]
struct MinecraftSearchEntry {
    title: Option<String>,
    description: Option<String>,
    image: Option<String>,
    url: Option<String>,
    time: Option<i64>,
}

fn client() -> reqwest::Client {
    reqwest::Client::new()
}

fn validate_minecraft_article_url(value: &str) -> Result<String, String> {
    let url = reqwest::Url::parse(value).map_err(|_| "Invalid article URL.".to_string())?;
    if url.scheme() != "https"
        || url.host_str() != Some("www.minecraft.net")
        || !url.path().starts_with("/en-us/article")
    {
        return Err("Only official Minecraft article URLs can be opened.".into());
    }
    Ok(url.to_string())
}

fn validate_minecraft_search_url(value: &str) -> Result<(), String> {
    let url = reqwest::Url::parse(value).map_err(|_| "Invalid news search URL.".to_string())?;
    if url.scheme() != "https" || url.host_str() != Some("net-secondary.web.minecraft-services.net")
    {
        return Err("Only the official Minecraft news API can be used.".into());
    }
    Ok(())
}

fn validate_minecraft_image_url(value: &str) -> Option<String> {
    let url = reqwest::Url::parse(value).ok()?;
    if url.scheme() == "https" && url.host_str() == Some("www.minecraft.net") {
        Some(url.to_string())
    } else {
        None
    }
}

fn decode_html(value: &str) -> String {
    let entity_re = Regex::new(r"&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos|nbsp);").unwrap();
    entity_re
        .replace_all(value, |caps: &regex::Captures<'_>| {
            let entity = &caps[1];
            match entity {
                "amp" => "&".to_string(),
                "lt" => "<".to_string(),
                "gt" => ">".to_string(),
                "quot" => "\"".to_string(),
                "apos" => "'".to_string(),
                "nbsp" => " ".to_string(),
                _ if entity.starts_with("#x") => u32::from_str_radix(&entity[2..], 16)
                    .ok()
                    .and_then(char::from_u32)
                    .map(|c| c.to_string())
                    .unwrap_or_else(|| caps[0].to_string()),
                _ if entity.starts_with('#') => entity[1..]
                    .parse::<u32>()
                    .ok()
                    .and_then(char::from_u32)
                    .map(|c| c.to_string())
                    .unwrap_or_else(|| caps[0].to_string()),
                _ => caps[0].to_string(),
            }
        })
        .to_string()
}

fn strip_tags(value: &str) -> String {
    let tag_re = Regex::new(r"(?is)<[^>]+>").unwrap();
    decode_html(&tag_re.replace_all(value, " "))
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .trim()
        .to_string()
}

fn absolutize_url(url: &str) -> String {
    if url.starts_with("http://") || url.starts_with("https://") {
        url.to_string()
    } else if url.starts_with("//") {
        format!("https:{url}")
    } else {
        format!("{NEWS_BASE_URL}{url}")
    }
}

fn trusted_image_url(url: &str) -> Option<String> {
    validate_minecraft_image_url(&absolutize_url(url))
}

fn format_unix_date(value: i64) -> Option<String> {
    chrono::DateTime::from_timestamp(value, 0).map(|date| date.format("%Y-%m-%d").to_string())
}

fn first_match(value: &str, patterns: &[Regex]) -> Option<String> {
    for pattern in patterns {
        if let Some(caps) = pattern.captures(value) {
            if let Some(m) = caps.get(1) {
                return Some(m.as_str().to_string());
            }
        }
    }
    None
}

#[tauri::command]
pub async fn minecraft_news() -> Result<Vec<MinecraftNewsItem>, String> {
    match fetch_search_news().await {
        Ok(items) if !items.is_empty() => return Ok(items),
        _ => {}
    }

    fetch_featured_news().await
}

async fn fetch_search_news() -> Result<Vec<MinecraftNewsItem>, String> {
    validate_minecraft_search_url(NEWS_SEARCH_URL)?;
    let response = client()
        .get(NEWS_SEARCH_URL)
        .query(&[
            ("category", "News"),
            ("page", "1"),
            ("pageSize", "24"),
            ("sortType", "Recent"),
            ("newsOnly", "true"),
            ("geography", "US"),
        ])
        .header("User-Agent", UA)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    validate_minecraft_search_url(response.url().as_str())?;
    if !response.status().is_success() {
        return Err(format!("HTTP {} for Minecraft news API", response.status()));
    }

    let data: MinecraftSearchResponse = response.json().await.map_err(|e| e.to_string())?;
    let mut items = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();

    for entry in data
        .result
        .and_then(|result| result.results)
        .unwrap_or_default()
    {
        let Some(raw_url) = entry.url else {
            continue;
        };
        let Ok(url) = validate_minecraft_article_url(&raw_url) else {
            continue;
        };
        if !seen.insert(url.clone()) {
            continue;
        }

        let Some(title) = entry.title else {
            continue;
        };

        items.push(MinecraftNewsItem {
            title: strip_tags(&title),
            summary: strip_tags(entry.description.as_deref().unwrap_or("")),
            image_url: entry.image.as_deref().and_then(trusted_image_url),
            url,
            published_at: entry.time.and_then(format_unix_date),
        });
    }

    Ok(items)
}

async fn fetch_featured_news() -> Result<Vec<MinecraftNewsItem>, String> {
    let html = client()
        .get(NEWS_HUB_URL)
        .header("User-Agent", UA)
        .header("Accept", "text/html,application/xhtml+xml")
        .send()
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;

    let card_re = Regex::new(r#"(?is)<div\b[^>]*class="[^"]*\bMC_tiledHeroA_card\b[^"]*"[^>]*>(?P<body>.*?)<a\b[^>]*href="(?P<href>[^"]+)"[^>]*>[\s\S]*?(?:Discover more|Brave the unknown|Explore more|Learn more)[\s\S]*?</a>[\s\S]*?</div>\s*</div>"#).unwrap();
    let title_res =
        [
            Regex::new(r#"(?is)<h2\b[^>]*class="[^"]*\bMC_Heading_3\b[^"]*"[^>]*>(.*?)</h2>"#)
                .unwrap(),
        ];
    let summary_res = [Regex::new(r#"(?is)<div\b[^>]*class="[^"]*\bMC_tiledHeroA_blurb\b[^"]*"[^>]*>[\s\S]*?<p\b[^>]*>(.*?)</p>"#).unwrap()];
    let image_res = [Regex::new(r#"(?is)<img\b[^>]*src="([^"]+)"[^>]*alt="([^"]*)""#).unwrap()];

    let mut items = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();

    for caps in card_re.captures_iter(&html) {
        let href = caps.name("href").map(|m| m.as_str()).unwrap_or("");
        if href.is_empty() || !seen.insert(href.to_string()) {
            continue;
        }
        let body = caps.name("body").map(|m| m.as_str()).unwrap_or("");

        let title = match first_match(body, &title_res) {
            Some(v) => strip_tags(&v),
            None => continue,
        };
        let summary = first_match(body, &summary_res).map_or_else(String::new, |v| strip_tags(&v));

        let image_url = first_match(body, &image_res).and_then(|value| {
            let candidate = value.split(',').next()?.trim().split_whitespace().next()?;
            trusted_image_url(candidate)
        });

        let url = match validate_minecraft_article_url(&absolutize_url(href)) {
            Ok(url) => url,
            Err(_) => continue,
        };

        items.push(MinecraftNewsItem {
            title,
            summary,
            image_url,
            url,
            published_at: None,
        });
    }

    Ok(items)
}

#[tauri::command]
pub fn open_minecraft_news_article(url: String) -> Result<(), String> {
    let url = validate_minecraft_article_url(&url)?;

    #[cfg(target_os = "windows")]
    let mut cmd = {
        let mut cmd = Command::new("explorer");
        cmd.arg(&url);
        cmd
    };

    #[cfg(target_os = "macos")]
    let mut cmd = {
        let mut cmd = Command::new("open");
        cmd.arg(&url);
        cmd
    };

    #[cfg(all(unix, not(target_os = "macos")))]
    let mut cmd = {
        let mut cmd = Command::new("xdg-open");
        cmd.arg(&url);
        cmd
    };

    cmd.spawn().map_err(|e| e.to_string())?;
    Ok(())
}
