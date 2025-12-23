# Change Checker
This project is in order to check for changes in a directory using XXH3 and mtime/size
## Usage
There are three different ways you can use this program
### Boolean mode:
```js
if (checker.checkFile('src/')) {
    console.log("src changed");
}
```
### Detailed mode:
```js
const info = checker.checkFile("src/", { mode: "detail" });

console.log(info);
/*
{
  filePath: 'src/app.js',
  changed: true,
  suspicious: true,
  mtimeMs: 123456789,
  size: 2048,
  hash: 'a1b2c3d4...'
}
*/
```
### Callback mode:
```js
checker.checkFolder("src", {
  mode: "callback",
  onChange(info) {
    if (info.changed) {
      console.log("Changed:", info.filePath, "hash:", info.hash);
    }
  }
});
```