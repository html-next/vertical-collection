import * as fs from 'fs';
import * as path from 'path';

const extractAndAppendSnippets = (filepath, snippetsList) => {
  let content = fs.readFileSync(filepath, 'utf-8');
  let rows = content.split('\n');
  while (rows.length) {
    let row = rows.shift();
    let match = row.match(/! BEGIN-SNIPPET (.*) /);
    if (match) {
      let snippetContent = [];
      do {
        row = rows.shift();
        if (row.match(/! END-SNIPPET /)) {
          break;
        }
        snippetContent.push(row);
      } while (rows.length)
      snippetsData[match[1]] = {
        source: filepath,
        content: snippetContent.join('\n')
      };
    }
  }
}

const buildSnippetsListData = (dir, snippetsData={}) => {
  const files = fs.readdirSync(dir);

  for (let file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      buildSnippetsListData(filepath, snippetsData);
    } else if (file !== 'snippets.js' && file.match(/\.(js|hbs)$/)) {
      extractAndAppendSnippets(filepath, snippetsData);
    }
  }
}

let snippetsData = {};
buildSnippetsListData('tests/dummy/app/', snippetsData);

fs.writeSync(fs.openSync('tests/dummy/app/snippets.js', 'w'), `export default ${JSON.stringify(snippetsData)}`, 0, 'utf8');
