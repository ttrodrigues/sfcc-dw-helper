<script lang="ts">
    
</script>

<style>
    
    * {
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

    #btnCreate {
       margin-top: 20px; 
       width: 100%;
    }

    div#error{
       margin-top: 10px; 
    }

</style>

<div id="error">

    <div>This folder do not has a dw.json file or is not a SFCC project!</div>
    <div>Please click on bellow button to create one.</div>

    <!-- svelte-ignore missing-declaration -->
    <button on:click={()=>{
        tsvscode.postMessage({
            type: 'onCreateFile',
            value: 'dw.json'
        });
    }} id="btnCreate" class="monaco-button monaco-text-button">Create a dw.json</button>

</div>