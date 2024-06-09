const vscode = require('vscode');

const LINE_LIMIT = 10000; // 10,000 lines

function exceedsLineLimit(content) {
    return content.split('\n').length > LINE_LIMIT;
}

function countWords(content) {
    return content.split(/\s+/).filter(word => word.length > 0).length;
}

function countLines(content) {
    return content.split('\n').length;
}

async function processDocuments(selectedFiles) {
    let content = '';
    let exceededFiles = [];
    let totalWords = 0;
    let totalLines = 0;
    let totalFiles = 0;

    const openTextDocuments = vscode.window.visibleTextEditors.map(editor => editor.document);

    for (const document of openTextDocuments) {
        if (selectedFiles.includes(document.fileName)) {
            const fileContent = document.getText();
            if (!exceedsLineLimit(fileContent)) {
                content += `\n----- ${document.fileName} -----\n\n${fileContent}\n`;
                totalWords += countWords(fileContent);
                totalLines += countLines(fileContent);
                totalFiles++;
            } else {
                exceededFiles.push(document.fileName);
                console.warn(`Skipped ${document.fileName} due to line limit`);
            }
        }
    }

    return { content, exceededFiles, totalWords, totalLines, totalFiles };
}

function getWebviewContent(fileListHtml) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Select Files</title>
        <style>
            .tooltip {
                display: none;
                background-color: #f9f9f9;
                border: 1px solid #ccc;
                padding: 10px;
                position: absolute;
                z-index: 1;
                white-space: pre-wrap; /* To ensure newlines are rendered */
            }
        </style>
    </head>
    <body>
        <h1>Select Files to Copy</h1>
        <form id="fileForm">
            ${fileListHtml}
            <br>
            <button type="button" id="copyButton" onclick="copySelectedFiles()" disabled>Copy</button>
            <span id="selectMessage" style="color: red; display: none;">Please select at least one file</span>
        </form>
        <p id="stats"></p>
        <script>
            const vscode = acquireVsCodeApi();
            
            function copySelectedFiles() {
                const selectedFiles = [];
                const checkboxes = document.querySelectorAll('input[name="file"]:checked');
                checkboxes.forEach(checkbox => {
                    selectedFiles.push(checkbox.value);
                });
                vscode.postMessage({
                    command: 'copySelectedFiles',
                    selectedFiles: selectedFiles
                });
            }

            function updateStats() {
                const selectedFiles = [];
                const checkboxes = document.querySelectorAll('input[name="file"]:checked');
                checkboxes.forEach(checkbox => {
                    selectedFiles.push(checkbox.value);
                });
                
                const copyButton = document.getElementById('copyButton');
                const selectMessage = document.getElementById('selectMessage');
                
                if (selectedFiles.length > 0) {
                    copyButton.disabled = false;
                    selectMessage.style.display = 'none';
                } else {
                    copyButton.disabled = true;
                    selectMessage.style.display = 'block';
                }

                vscode.postMessage({
                    command: 'updateStats',
                    selectedFiles: selectedFiles
                });
            }

            document.querySelectorAll('input[name="file"]').forEach(checkbox => {
                checkbox.addEventListener('change', updateStats);
            });

            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'updateStats') {
                    document.getElementById('stats').textContent = \`\${message.totalFiles} files selected, \${message.totalWords} words total, \${message.totalLines} lines total\`;
                }
            });

            updateStats(); // Initial stats calculation
        </script>
    </body>
    </html>`;
}

async function handleCopyCommand(selectedFiles = null) {
    const openTextDocuments = vscode.window.visibleTextEditors.map(editor => editor.document);

    if (!selectedFiles) {
        selectedFiles = openTextDocuments.map(doc => doc.fileName);
    }

    const { content, exceededFiles, totalWords, totalLines, totalFiles } = await processDocuments(selectedFiles);

    await vscode.env.clipboard.writeText(content);
    vscode.window.showInformationMessage(`Copied ${totalWords} words, ${totalFiles} files, ${totalLines} lines to clipboard!`);

    if (exceededFiles.length > 0) {
        vscode.window.showWarningMessage(`The following files were skipped due to line limit: ${exceededFiles.join(', ')}`);
    }
}

async function activate(context) {
    let copyAllCommand = vscode.commands.registerCommand('extension.copyAllOpenFiles', () => handleCopyCommand());

    let selectFilesCommand = vscode.commands.registerCommand('extension.selectFilesToCopy', async () => {
        const openTextDocuments = vscode.window.visibleTextEditors.map(editor => editor.document);

        const panel = vscode.window.createWebviewPanel(
            'selectFiles',
            'Select Files to Copy',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        let fileListHtml = openTextDocuments
            .map((doc, index) => {
                return `<input type="checkbox" id="file${index}" name="file" value="${doc.fileName}" checked>
                        <label for="file${index}">${doc.fileName}</label><br>`;
            }).join('');

        panel.webview.html = getWebviewContent(fileListHtml);

        panel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'copySelectedFiles') {
                handleCopyCommand(message.selectedFiles);
            } else if (message.command === 'updateStats') {
                const selectedFiles = message.selectedFiles;
                let totalWords = 0;
                let totalLines = 0;
                let totalFiles = selectedFiles.length;

                for (const document of openTextDocuments) {
                    if (selectedFiles.includes(document.fileName)) {
                        const fileContent = document.getText();
                        totalWords += countWords(fileContent);
                        totalLines += countLines(fileContent);
                    }
                }

                panel.webview.postMessage({
                    command: 'updateStats',
                    totalFiles: totalFiles,
                    totalWords: totalWords,
                    totalLines: totalLines
                });
            }
        });
    });

    context.subscriptions.push(copyAllCommand);
    context.subscriptions.push(selectFilesCommand);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
