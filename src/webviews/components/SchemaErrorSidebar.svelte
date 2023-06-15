<script lang="ts">
    
    // @ts-nocheck
    
    const fixJsonFile = () => {
        const jsonContent = {
            "hostname": "hostname",
            "username": "username",
            "password": "password",
            "code-version": "code-version"
        };
        
        tsvscode.postMessage({
            type: 'fixJsonFile',
            value: jsonContent
        });
    }


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

    button:hover {
        background-color: var(--vscode-button-hoverBackground);
    }

    button:focus{
        outline-offset: -1px;
        outline-color: var(--vscode-focusBorder);
    }
    
    div#main{
       margin-top: 10px; 
    }

    #btnFix {
       margin-top: 20px; 
       width: 100%;
    }
    
</style>

<div id="main">
           
    <p>Detected a dw.json file with a schema error!</p>
    <p>The properties names are incorrect or not in string format.</p>

    <!-- svelte-ignore missing-declaration -->
    <button on:click={()=>{
        fixJsonFile();
    }} id="btnFix" class="monaco-button monaco-text-button">Fix the dw.json</button>

</div>