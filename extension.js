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

async function processDocuments() {
    let content = '';
    let exceededFiles = [];
    let totalWords = 0;
    let totalLines = 0;
    let totalFiles = 0;

    const openTextDocuments = vscode.window.visibleTextEditors.map(editor => editor.document);

    for (const document of openTextDocuments) {
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

    return { content, exceededFiles, totalWords, totalLines, totalFiles };
}

async function handleCopyCommand() {
    const { content, exceededFiles, totalWords, totalLines, totalFiles } = await processDocuments();

    await vscode.env.clipboard.writeText(content);
    vscode.window.showInformationMessage(`Copied ${totalFiles} files (${totalWords} words, ${totalLines} lines) to clipboard!`);

    if (exceededFiles.length > 0) {
        vscode.window.showWarningMessage(`The following files were skipped due to line limit: ${exceededFiles.join(', ')}`);
    }
}

async function activate(context) {
    let copyAllCommand = vscode.commands.registerCommand('extension.copyAllOpenFiles', () => handleCopyCommand());

    context.subscriptions.push(copyAllCommand);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
