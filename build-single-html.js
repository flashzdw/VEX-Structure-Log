const fs = require('fs');
const path = require('path');

console.log('开始构建单HTML文件...');

const distDir = path.join(__dirname, 'dist');
const htmlPath = path.join(distDir, 'index.html');

// 读取构建后的HTML
let html = fs.readFileSync(htmlPath, 'utf8');

// 找到所有资源文件并内联
const linkRegex = /<link[^>]+href="([^"]+)"[^>]*>/g;
const scriptRegex = /<script[^>]+src="([^"]+)"[^>]*><\/script>/g;

// 内联CSS
html = html.replace(linkRegex, (match, href) => {
  if (!href.endsWith('.css')) return match;
  
  const cssPath = path.join(distDir, href.replace(/^\.\//, ''));
  if (fs.existsSync(cssPath)) {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    return `<style>${cssContent}</style>`;
  }
  return match;
});

// 内联JS
html = html.replace(scriptRegex, (match, src) => {
  if (src.includes('type="module"')) {
    // 对于module脚本，我们保留原样，但需要处理路径
    // 实际上更好的方法是使用打包工具，这里我们简化处理
    return match;
  }
  const jsPath = path.join(distDir, src.replace(/^\.\//, ''));
  if (fs.existsSync(jsPath)) {
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    return `<script>${jsContent}</script>`;
  }
  return match;
});

// 对于React/Vite的module打包，我们需要一个更好的方案
// 实际上，更好的方法是使用vite-plugin-singlefile
// 但让我们先尝试简单方案

// 保存为单HTML文件
const outputPath = path.join(__dirname, 'VEX-结构记录.html');
fs.writeFileSync(outputPath, html, 'utf8');

console.log(`✅ 单HTML文件已生成: ${outputPath}`);
console.log('现在您可以双击打开这个文件了！');
