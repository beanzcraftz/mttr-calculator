const fs=require('fs'); let css=fs.readFileSync('styles.css', 'utf8'); css = css.replace('min-height: 100vh;', 'min-height: 100vh; overflow-x: hidden;'); fs.writeFileSync('styles.css', css);
