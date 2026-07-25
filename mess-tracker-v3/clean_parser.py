import re

with open('src/utils/parser.js', 'r') as f:
    content = f.read()

# Remove parseScrapedPollsText function
content = re.sub(r'export function parseScrapedPollsText.*?// ==========================================.*?$', '', content, flags=re.DOTALL)

with open('src/utils/parser.js', 'w') as f:
    f.write(content)

