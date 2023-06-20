<script lang="ts">
    // @ts-nocheck
    let isBtnDisabled:boolean = !isWorkspaceOpen;

</script>

<style>
    :global(body) {
        font-family: Segoe WPC,Segoe UI,sans-serif;
        font-size: 13px;
    }

    button {
        color: var(--vscode-button-foreground); 
        background-color: var(--vscode-button-background);
        border: 1px solid var(--vscode-button-border,transparent);
        cursor: pointer;
        box-sizing: border-box;  
        height: 28px;      
    }

    button:hover{
        background-color: var(--vscode-button-hoverBackground);
    }

    button:focus{
        outline-offset: -1px;
        outline-color: var(--vscode-focusBorder);
    }

    button:disabled{
        cursor:not-allowed;
    }

    #btnCreate {
       margin-top: 20px; 
       width: 100%;
    }

    div#error{
       margin-top: 10px; 
       min-width: 250px;
       padding-right: 20px;
    }

    .btn {
        width: 100%;
        min-width: 250px;
        margin-top: 10px;
    }
    
</style>

<div id="error">

    <p>This folder do not has a dw.json file or is not a SFCC project!</p>
    <p>If you already have a workspace open, please click on bellow button to create anew dw.json file.</p>
    <p>Otherwise,the button will be disabled until a workspace has been open.</p>


    <!-- svelte-ignore missing-declaration -->
    <button on:click={()=>{
        tsvscode.postMessage({
            type: 'onCreateFile',
            value: 'dw.json'
        });
    }} id="btnCreate" class="monaco-button monaco-text-button btn" disabled={isBtnDisabled}>{isBtnDisabled ? "Create a dw.json disabled for missing workspace" : "Create a dw.json"}</button>

</div>