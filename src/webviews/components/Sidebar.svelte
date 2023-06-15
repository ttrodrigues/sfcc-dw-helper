<script lang="ts">
    
    // @ts-nocheck
    
    import { onMount } from 'svelte';
    import ShowIcon from './ShowIcon.svelte'
    import HideIcon from './HideIcon.svelte'
    
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
    #btnSeePassword {
       width: 50px;
       height: 24px;
       margin-left: 15px;
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
    
        <div>Password</div>
        <input on:change={()=>{
            changeJsonFile();
        }} type={isPasswordVisible ? "text" : "password"} id="password">
    
        <button on:click={()=>{
            isPasswordVisible = !isPasswordVisible;
        }} id="btnSeePassword" class="monaco-button monaco-text-button">{isPasswordVisible ? 'Hide' : 'Show'}</button>
             
</div>