<script lang="ts">
    
    // @ts-nocheck
    
    import { onMount } from 'svelte';
    import ShowIcon from './ShowIcon.svelte'
    import HideIcon from './HideIcon.svelte'

    let componentSelected:svelteHTML = ShowIcon;

    let isProphetInstalled:boolean;
    
    // To change the visibility of password field
    let isPasswordVisible:boolean = false;   
    
    onMount(() => {
        const hostnameInput:HTMLElement = document.getElementById('hostname');
        const usernameInput:HTMLElement = document.getElementById('userName');
        const passwordInput:HTMLElement = document.getElementById('password');
        const codeversionInput:HTMLElement = document.getElementById('codeVersion');
        
        usernameInput?.value = initUsername;
        passwordInput?.value = initPassword;
        hostnameInput?.value = initHostname;
        codeversionInput?.value = initCodeversion;
        
        isProphetInstalled = isProphetInstall;
    }
    );
    
    const changeJsonFile = () => {
        const hostname:string = document.getElementById('hostname')?.value;
        const username:string = document.getElementById('userName')?.value;
        const password:string = document.getElementById('password')?.value;
        const codeversion:string = document.getElementById('codeVersion')?.value;

        const jsonContent = {
            "hostname": hostname,
            "username": username,
            "password": password,
            "code-version": codeversion
        };
        
        tsvscode.postMessage({
            type: 'onChangeFile',
            value: jsonContent
        });
    }

    const clickBtnCleanUpload = () => {
        tsvscode.postMessage({
            type: 'onCleanUpload',
            value: true
        });
    }

    const clickBtnDisableUpload = () => {
        tsvscode.postMessage({
            type: 'onDisableUpload',
            value: true
        });
    }

    const clickBtnEnableUpload = () => {
        tsvscode.postMessage({
            type: 'onEnableUpload',
            value: true
        });
    }
    
    function buttonClick() {
        isPasswordVisible = !isPasswordVisible;
        componentSelected = isPasswordVisible ? HideIcon : ShowIcon;
    }
    
</script>

<style>
    :global(body) {
        font-family: Segoe WPC,Segoe UI,sans-serif;
        font-size: 13px;
    }

    input {
        color: var(--vscode-input-foreground);
        background-color: inherit;
        border: none;
        background-color: var(--vscode-input-background);
        height: 28px;
    }

    input:focus{
        outline-offset: -1px;
        outline-color: var(--vscode-focusBorder);
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
       min-width: 350px;
    }
    #hostname {
       margin-top: 5px; 
       margin-bottom: 20px; 
       width: 100%;
       max-width: 350px;
    }
    #codeVersion {
       margin-top: 5px; 
       margin-bottom: 20px; 
       width: 100%;
       max-width: 180px;
    }
    #userName {
       margin-top: 5px; 
       margin-bottom: 20px; 
       width: 100%;
       max-width: 180px; 
    }
    #password {
       margin-top: 5px; 
       margin-bottom: 20px; 
       width: 100%;
       max-width: 180px;
    }
    
    #btnSvg {
       width: 28px;
       height: 28px;
       left: 205px;
       position: absolute;
       color: transparent;
       background-color: transparent;
       margin-top: 6px;
    }

    #btnSvg:hover {
        background-color: transparent;
    }

    #prophetBtn {
        margin-top: 20px; 
        margin-bottom: 20px; 
    }

</style>       

<div id="main">

        <div>Hostname</div>
        <input on:change={()=>{
            changeJsonFile();
        }} type="text" id="hostname">
    
        <div>Code Version</div>
        <input on:change={()=>{
            changeJsonFile();
        }} type="text" id="codeVersion">
    
        <div>User Name</div>
        <input on:change={()=>{
            changeJsonFile();
        }} type="text" id="userName">
    
        <div>
            <div>Password</div>
            <input on:change={()=>{
                changeJsonFile();
            }} type={isPasswordVisible ? "text" : "password"} id="password">
        
            <svelte:component this={componentSelected} />
            <button id="btnSvg" on:click={()=>{
                buttonClick()
            }}></button>            
        </div>

        {#if isProphetInstalled}
            <div id="prophetBtn">
                <button on:click={()=>{
                    clickBtnCleanUpload();
                }}>Clean Project</button>

                <button on:click={()=>{
                    clickBtnEnableUpload();
                }}>Enable Upload</button>

                <button on:click={()=>{
                    clickBtnDisableUpload();
                }}>Disable Upload</button>
            </div>
        {/if}

</div>