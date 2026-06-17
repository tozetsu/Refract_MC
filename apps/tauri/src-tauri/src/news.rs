use regex::Regex;
use serde::Serialize;
use std::collections::HashSet;

const NEWS_HUB_URL: &str = "https://www.minecraft.net/en-us/article";
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

fn client() -> reqwest::Client {
    reqwest::Client::new()
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
            Some(absolutize_url(candidate))
        });

        items.push(MinecraftNewsItem {
            title,
            summary,
            image_url,
            url: absolutize_url(href),
            published_at: None,
        });
    }

    Ok(items)
}
