use crate::downloader;
use std::path::Path;

pub const MINECRAFT_HOSTS: &[&str] = &[
    "launchermeta.mojang.com",
    "piston-meta.mojang.com",
    "piston-data.mojang.com",
    "launcher.mojang.com",
    "libraries.minecraft.net",
    "resources.download.minecraft.net",
    "maven.fabricmc.net",
    "meta.fabricmc.net",
    "maven.quiltmc.org",
    "meta.quiltmc.org",
    "files.minecraftforge.net",
    "maven.minecraftforge.net",
    "maven.neoforged.net",
];

pub const MODRINTH_HOSTS: &[&str] = &["api.modrinth.com", "cdn.modrinth.com"];
pub const CURSEFORGE_HOSTS: &[&str] = &[
    "api.curseforge.com",
    "www.curseforge.com",
    "curseforge.com",
    "edge.forgecdn.net",
    "mediafilez.forgecdn.net",
];
pub const FTB_HOSTS: &[&str] = &[
    "api.modpacks.ch",
    "cdn.feed-the-beast.com",
    "edge.forgecdn.net",
    "mediafilez.forgecdn.net",
    "www.curseforge.com",
    "curseforge.com",
];
pub const JAVA_HOSTS: &[&str] = &[
    "api.adoptium.net",
    "github.com",
    "objects.githubusercontent.com",
    "github-releases.githubusercontent.com",
    "release-assets.githubusercontent.com",
];

#[derive(Clone, Copy)]
pub enum ExpectedHash<'a> {
    Sha1(&'a str),
    Sha512(&'a str),
}

fn host_allowed(host: &str, allowed: &[&str]) -> bool {
    allowed.iter().any(|allowed_host| host == *allowed_host)
}

pub fn validate_url(url: &str, allowed_hosts: &[&str]) -> Result<(), String> {
    let parsed = reqwest::Url::parse(url).map_err(|e| format!("Invalid URL {url}: {e}"))?;
    if parsed.scheme() != "https" {
        return Err(format!("Refusing non-HTTPS download: {url}"));
    }
    let host = parsed
        .host_str()
        .ok_or_else(|| format!("URL has no host: {url}"))?;
    if !host_allowed(host, allowed_hosts) {
        return Err(format!("Refusing download from untrusted host: {host}"));
    }
    Ok(())
}

pub fn validate_url_any(url: &str, allowed_host_groups: &[&[&str]]) -> Result<(), String> {
    let mut last = None;
    for allowed_hosts in allowed_host_groups {
        match validate_url(url, allowed_hosts) {
            Ok(()) => return Ok(()),
            Err(e) => last = Some(e),
        }
    }
    Err(last.unwrap_or_else(|| format!("No trusted hosts configured for {url}")))
}

/// Download `url` to `dest` through the shared engine: pooled client, streamed
/// body, hash verification, atomic rename, bounded retries.
pub async fn download_to(
    url: &str,
    dest: &Path,
    allowed_hosts: &'static [&'static str],
    expected_hash: Option<ExpectedHash<'_>>,
) -> Result<(), String> {
    let hash = expected_hash.map(|h| match h {
        ExpectedHash::Sha1(want) => downloader::OwnedHash::Sha1(want.to_string()),
        ExpectedHash::Sha512(want) => downloader::OwnedHash::Sha512(want.to_string()),
    });
    downloader::fetch(&downloader::Task::new(url, dest.to_path_buf(), allowed_hosts).hash(hash))
        .await
        .map(|_| ())
}
