import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# Remove handleScrapedFileUpload
content = re.sub(r'const handleScrapedFileUpload =.*?};\n', '', content, flags=re.DOTALL)

# Remove scrapedFileName and scrapedFileInputRef state
content = re.sub(r'\s*const \[scrapedFileName, setScrapedFileName\] = useState\(\'\'\);\n', '\n', content)
content = re.sub(r'\s*const scrapedFileInputRef = useRef\(null\);\n', '\n', content)

# Remove the scraped upload JSX
jsx_to_remove = r'<div style={{ marginTop: \'1rem\', borderTop: \'1px solid rgba\(255,255,255,0\.1\)\', paddingTop: \'1rem\' }}>\s*<h2 className="section-title"><Upload size=\{20\} /> Upload Scraped Polls \(\.txt\)</h2>.*?</div>\s*</div>'
content = re.sub(jsx_to_remove, '</div>', content, flags=re.DOTALL)

with open('src/App.jsx', 'w') as f:
    f.write(content)

