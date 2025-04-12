#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(debug_assertions)]
use tauri::Manager;
use std::fs;
use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};
use chrono;

// 字体信息结构
#[derive(Debug, Serialize, Deserialize, Clone)]
struct FontInfo {
    name: String,
    path: String,
    family: String,
    style: String,
}

// 字体缓存管理
struct FontCache {
    fonts: Vec<FontInfo>,
    loaded: bool,
}

impl FontCache {
    fn new() -> Self {
        FontCache {
            fonts: Vec::new(),
            loaded: false,
        }
    }
    
    fn load_fonts(&mut self) -> Result<(), String> {
        if self.loaded {
            return Ok(());
        }
        
        // 不同操作系统的字体目录
        let font_dirs = if cfg!(target_os = "windows") {
            vec![
                "C:\\Windows\\Fonts".to_string(),
                "C:\\Users\\Public\\AppData\\Local\\Microsoft\\Windows\\Fonts".to_string(),
            ]
        } else if cfg!(target_os = "macos") {
            let home_dir = std::env::var("HOME").unwrap_or_default();
            let home_fonts = format!("{}/Library/Fonts", home_dir);
            vec![
                "/System/Library/Fonts".to_string(),
                "/Library/Fonts".to_string(),
                "/Users/Shared/Library/Fonts".to_string(),
                home_fonts,
            ]
        } else {
            vec![] // 其他系统（包括Linux）不再支持
        };

        for dir in &font_dirs {
            if let Ok(entries) = fs::read_dir(dir) {
                for entry in entries {
                    if let Ok(entry) = entry {
                        let path = entry.path();
                        if path.extension().map_or(false, |ext| {
                            ext == "ttf" || ext == "otf" || ext == "ttc" || ext == "woff" || ext == "woff2"
                        }) {
                            let file_name = path.file_name()
                                .unwrap_or_default()
                                .to_string_lossy()
                                .to_string();
                            
                            // 从文件名中提取字体名称和样式
                            let name = file_name.split('.').next().unwrap_or(&file_name).to_string();
                            let family = name.split('-').next().unwrap_or(&name).to_string();
                            let style = if name.contains('-') {
                                name.split('-').nth(1).unwrap_or("Regular").to_string()
                            } else {
                                "Regular".to_string()
                            };

                            self.fonts.push(FontInfo {
                                name,
                                path: path.to_string_lossy().to_string(),
                                family,
                                style,
                            });
                        }
                    }
                }
            }
        }
        
        self.loaded = true;
        Ok(())
    }
    
    fn get_all_fonts(&mut self) -> Result<Vec<FontInfo>, String> {
        self.load_fonts()?;
        Ok(self.fonts.clone())
    }
    
    fn get_paginated_fonts(&mut self, page: usize, page_size: usize) -> Result<Vec<FontInfo>, String> {
        self.load_fonts()?;
        
        let start = page * page_size;
        let end = (start + page_size).min(self.fonts.len());
        
        if start >= self.fonts.len() {
            return Ok(Vec::new());
        }
        
        Ok(self.fonts[start..end].to_vec())
    }
    
    fn get_font_count(&mut self) -> Result<usize, String> {
        self.load_fonts()?;
        Ok(self.fonts.len())
    }
}

// 获取所有系统字体（仍然保留以向后兼容）
#[tauri::command]
fn get_system_fonts(font_cache: tauri::State<Arc<Mutex<FontCache>>>) -> Result<Vec<FontInfo>, String> {
    let mut cache = font_cache.lock().unwrap();
    cache.get_all_fonts()
}

// 分页获取系统字体
#[tauri::command]
fn get_paginated_fonts(page: usize, page_size: usize, font_cache: tauri::State<Arc<Mutex<FontCache>>>) -> Result<Vec<FontInfo>, String> {
    let mut cache = font_cache.lock().unwrap();
    cache.get_paginated_fonts(page, page_size)
}

// 获取字体总数
#[tauri::command]
fn get_font_count(font_cache: tauri::State<Arc<Mutex<FontCache>>>) -> Result<usize, String> {
    let mut cache = font_cache.lock().unwrap();
    cache.get_font_count()
}

/// 从资源或本地文件获取更新日志内容
#[tauri::command]
fn get_changelog_text() -> Result<String, String> {
    // 在生产环境中尝试从应用资源目录读取CHANGELOG.md
    let changelog_path = std::path::PathBuf::from("CHANGELOG.md");
    
    if changelog_path.exists() {
        match fs::read_to_string(&changelog_path) {
            Ok(content) => {
                println!("成功从本地文件读取更新日志");
                return Ok(content);
            }
            Err(e) => {
                eprintln!("读取更新日志文件失败: {}", e);
            }
        }
    }
    
    // 如果本地文件不存在或读取失败，返回一个基本的更新日志
    let basic_changelog = format!(r#"
## v1.0.2 ({})

- [优化] 优化版本比较算法
- [修复] 修复版本检查相关问题

## v1.0.1 (2023-11-15)

- [新功能] 添加更新日志查看功能
- [优化] 优化右键菜单显示位置计算
- [修复] 修复主题菜单在设置侧边栏中的显示问题

## v1.0.0 (2023-10-01)

- [新功能] 首次发布
- [新功能] 支持系统字体浏览和预览
- [新功能] 支持收藏字体功能
- [新功能] 支持字体搜索功能
"#, chrono::Local::now().format("%Y-%m-%d"));

    println!("使用默认更新日志");
    Ok(basic_changelog)
}

fn main() {
    // 创建字体缓存
    let font_cache = Arc::new(Mutex::new(FontCache::new()));

    tauri::Builder::default()
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                // 在调试模式下，打开开发者工具
                let window = _app.get_window("main").unwrap();
                window.open_devtools();
            }
            
            Ok(())
        })
        .manage(font_cache)
        .invoke_handler(tauri::generate_handler![
            get_system_fonts, 
            get_paginated_fonts,
            get_font_count,
            get_changelog_text
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 