(function codeSnippets() {

    var playgrounds = Array.from(document.querySelectorAll(".language-souffle"));
    if (playgrounds.length > 0) {
        playgrounds.forEach(block => handle_crate_list_update(block, []));
    }



    function handle_crate_list_update(playground_block, playground_crates) {

        // and install on change listener to dynamically update ACE editors
        if (window.ace) {
            console.log(playground_block)
            let code_block = playground_block;//playground_block.querySelector("code");
            console.log(code_block);
            if (code_block.classList.contains("editable")) {
                let editor = window.ace.edit(code_block);
                // add Ctrl-Enter command to execute rust code
                editor.commands.addCommand({
                    name: "run",
                    bindKey: {
                        win: "Ctrl-Enter",
                        mac: "Ctrl-Enter"
                    },
                    exec: _editor => run_souffle_code(playground_block)
                });
            }
        }
    }


    function run_souffle_code(code_block) {
        var result_block = code_block.querySelector(".result");
        if (!result_block) {
            result_block = document.createElement('code');
            result_block.className = 'result hljs language-bash';

            code_block.append(result_block);
        }

        let text = playground_text(code_block);

        result_block.innerText = `Running... ${text}`;
    }

    // Process playground code blocks
    Array.from(document.querySelectorAll(".language-souffle")).forEach(function (souffle_block) {
        var pre_block = souffle_block.parentNode;
        // Add play button
        var buttons = pre_block.querySelector(".buttons");
        if (!buttons) {
            buttons = document.createElement('div');
            buttons.className = 'buttons';
            pre_block.insertBefore(buttons, pre_block.firstChild);
        }

        var runCodeButton = document.createElement('button');
        runCodeButton.className = 'fa fa-play play-button';
        runCodeButton.hidden = true;
        runCodeButton.title = 'Run this code';
        runCodeButton.setAttribute('aria-label', runCodeButton.title);

        buttons.insertBefore(runCodeButton, buttons.firstChild);
        runCodeButton.addEventListener('click', function (e) {
            run_souffle_code(pre_block);
        });

        let code_block = pre_block.querySelector("code");
        if (window.ace && code_block.classList.contains("editable")) {
            var undoChangesButton = document.createElement('button');
            undoChangesButton.className = 'fa fa-history reset-button';
            undoChangesButton.title = 'Undo changes';
            undoChangesButton.setAttribute('aria-label', undoChangesButton.title);

            buttons.insertBefore(undoChangesButton, buttons.firstChild);

            undoChangesButton.addEventListener('click', function () {
                let editor = window.ace.edit(code_block);
                editor.setValue(editor.originalCode);
                editor.clearSelection();
            });
        }
    });
})();