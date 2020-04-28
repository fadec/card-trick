import * as vscode from 'vscode';

const lineBuffer: string[] = [];
var shouldClearLineBufferOnChanges: boolean = true;

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerTextEditorCommand('card-trick.copy',
        copy);
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerTextEditorCommand('card-trick.cut',
        cut);
    context.subscriptions.push(disposable);

    vscode.workspace.onDidChangeTextDocument(() => {
        if (shouldClearLineBufferOnChanges) {
            lineBuffer.length = 0;
        }
    });
}

export function deactivate() { }

async function copy(textEditor: vscode.TextEditor) {
    copy_to_clipboard(textEditor);

    if (textEditor.selection.isEmpty) {
        const position = textEditor.selection.active;
        var newPosition = position.with(position.line + 1, 0);
        var newSelection = new vscode.Selection(newPosition, newPosition);
        textEditor.selection = newSelection;
    }
}

async function cut(textEditor: vscode.TextEditor) {

    const range = copy_to_clipboard(textEditor);

    shouldClearLineBufferOnChanges = false;
    await textEditor.edit(builder => {
        builder.delete(range);
    });
    shouldClearLineBufferOnChanges = true;
}

function copy_to_clipboard(textEditor: vscode.TextEditor): vscode.Range {
    let selectedText = "";
    let selection = textEditor.selection;

    // if no selection use whole line
    if (selection.isEmpty) {
        selection = new vscode.Selection(selection.start.line, 0, selection.start.line + 1, 0);
        selectedText = textEditor.document.getText(selection);

        // if not a trailing blank line
        if (!(selection.start.line === textEditor.document.lineCount - 1 &&
            selectedText.trim().length === 0)) {

            // If it's the last line of the file, add an eol.
            if (!selectedText.endsWith("\n")) {
                switch (textEditor.document.eol) {
                    case vscode.EndOfLine.CRLF:
                        selectedText += "\r\n";
                        break;
                    case vscode.EndOfLine.LF:
                        selectedText += "\n";
                        break;
                }
            }

            lineBuffer.push(selectedText);

            vscode.env.clipboard.writeText(lineBuffer.map(str => str).join(""));
        }
    }
    else {
        selectedText = textEditor.document.getText(selection);

        vscode.env.clipboard.writeText(selectedText);
    }

    return selection;
}

