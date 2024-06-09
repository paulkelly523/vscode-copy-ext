# Local Copy Extension

## Description

Local Copy Extension allows you to copy the contents of all open files in Visual Studio Code to the clipboard, including their absolute filenames. This can be useful for copying a code context to paste into a large language model like ChatGPT.

## Purpose

I (ok, it was mostly ChatGPT, but I came up with the idea) created this extension to save time when copying a group of files to paste into ChatGPT for my coding work. Manually copying each file's content was tedious, so this extension automates the process of copying a group of open files in Visual Studio Code.

## Features

- Copy the contents of all open files to the clipboard (shortcut: `Ctrl+Shift+C`)
- Includes absolute filenames in the copied content
- Option to select specific files to copy from the open files (shortcut: `Ctrl+Shift+X`)

## Usage

1. Open multiple files in Visual Studio Code.
2. Press `Ctrl+Shift+C` (default keybinding) to copy the contents of all open files to the clipboard.
3. Alternatively, use the command palette (`Ctrl+Shift+P`) and search for `Local Copy: Copy All Open Files` to perform the same action.
4. To select specific files to copy, use the command palette and search for `Local Copy: Select Files to Copy`. A window will open allowing you to select the files.

## Known Issues

1. A file can show as being a tabbed file in the workspace, but the file will not be loaded into memory. This extension will not copy the content of files that are not loaded into memory. To ensure that a file is loaded into memory, click on the file tab to open the file.

## Example Output

If you have the following files open:

1. **/path/to/your/project/file1.txt**:
    ```txt
    Hello, this is the content of the first file.
    ```

2. **/path/to/your/project/file2.js**:
    ```javascript
    console.log('This is the second file.');
    ```

3. **/path/to/your/project/file3.py**:
    ```python
    print("This is the third file.")
    ```

Pressing `Ctrl+Shift+C` will copy the following content to the clipboard:

```plaintext
----- /path/to/your/project/file1.txt -----

Hello, this is the content of the first file.

----- /path/to/your/project/file2.js -----

console.log('This is the second file.');

----- /path/to/your/project/file3.py -----

print("This is the third file.")
