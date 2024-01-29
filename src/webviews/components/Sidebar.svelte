<script lang="ts">
    
    // @ts-nocheck
    
    import { onMount } from 'svelte';
    import ShowIcon from './ShowIcon.svelte';
    import HideIcon from './HideIcon.svelte';
    import History from './History.svelte';
    import BracketMenu from './BracketMenu.svelte';
    import SettingsMenu from './SettingsMenu.svelte';
   
    let initialView:string = 'default';
    let isLoading:boolean = false;
    let environment:string = '';
    let componentSelected:svelteHTML = ShowIcon;
    let isProphetInstalled:boolean;
    let isToShowDevBuildBtn:boolean;
    let textCommandDevBuildBtn:string;
    let textLayoutDevBuildBtn:string;
    let isToShowPrdBuildBtn:boolean;
    let textCommandPrdBuildBtn:string;
    let textLayoutPrdBuildBtn:string;
    let codeversionConstant:string;
    let hostnameConstant:string;
    let codeversionPropertyShort:string;
    let hostnamePropertyShort:string;
    let isPasswordVisible:boolean = false;   
    let page: "bracket" | "settings" = tsvscode.getState()?.page || "bracket";

    $: {
        tsvscode.setState({ page });
    }
    
    onMount(() => {
        window.addEventListener('message', (event) => {
            const message = event.data; 
            switch (message.command) {
                case 'initialView': {
                    initialView = message.data;

                    if (initialView === 'checkWorkspace') {
                        tsvscode.postMessage({
                            type: 'onCheckWorkspace',
                            value: true
                        });
                    }
                                        
                    if (initialView === 'default') {
                        updateMarginTopMain(true);
                    } else {
                        updateMarginTopMain(false);
                    }     
                    
                    if (initialView === 'default' && page === "settings") {
                        updateClass('.settings', '.bracket');
                    }   

                    break;
                }

                case 'jsonValues': {
                    if (page === "bracket") {
                        const jsonValues = message.data;
    
                        document.getElementById('hostname').value = jsonValues.hostname;
                        document.getElementById('userName').value = jsonValues.username;
                        document.getElementById('password').value = jsonValues.password;
                        document.getElementById('codeVersion').value = jsonValues.codeversion;
                    }
                    
                    break;
                }      
                
                case 'loading': {
                    [isLoading, environment] = message.data;
                    
                    break;
                }  
            }
        });  

        if (initialView === 'default' && page === "settings") {
            updateClass('.settings', '.bracket');
        }        
        
        isProphetInstalled = isProphetInstall;
        isToShowDevBuildBtn = showDevBuildBtn;
        textCommandDevBuildBtn = commandDevBuildBtn;
        isToShowPrdBuildBtn = showPrdBuildBtn 
        textCommandPrdBuildBtn = commandPrdBuildBtn;
        textLayoutDevBuildBtn = textDevBuildBtn;
        textLayoutPrdBuildBtn = textPrdBuildBtn;
        codeversionConstant = codeversion;
        hostnameConstant = hostname;
        codeversionPropertyShort = codeversionHistoryPropertyShort;
        hostnamePropertyShort = hostnameHistoryPropertyShort;
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

    const clickBtnNewCodeversion = () => {
        tsvscode.postMessage({
            type: 'onNewCodeversion',
            value: true
        });
    }

    const clickBtnDeleteCodeversion = () => {
        tsvscode.postMessage({
            type: 'onDeleteCodeversion',
            value: true
        });
    }

    const clickBtnBuild = (option) => {
        tsvscode.postMessage({
            type: 'onBuild',
            value: option
        });
    }

    const changeProperty = (input:string, property:string) => {        
        tsvscode.postMessage({
            type: 'onChangeProperty',
            value: [input, property]
        });
    }

    const clickBtnHistory = (property:string) => {
        tsvscode.postMessage({
            type: 'onShowQuickPick',
            value: property
        });
    }

    const getInputData = () => {
        tsvscode.postMessage({
            type: 'onGetInputData',
            value: true
        });
    }

    const clickBtnLink = (isBusinessManager) => {
        tsvscode.postMessage({
            type: 'onBtnLink',
            value: [document.getElementById('hostname')?.value, isBusinessManager]
        });
    }

    const clickBtnOpenSettings = () => {
        tsvscode.postMessage({
            type: 'onOpenSettings',
            value: true
        });
    }    
    
    const buttonClick = () => {
        isPasswordVisible = !isPasswordVisible;
        componentSelected = isPasswordVisible ? HideIcon : ShowIcon;
    }

    const updateClass = (classNameAdd, classNameRemove) => {
        const elementToAdd = document.querySelector(classNameAdd);
        elementToAdd.classList.add('selected');
        const elementToRemove = document.querySelector(classNameRemove);
        elementToRemove.classList.remove('selected');
    }

    const updateMarginTopMain = (isDefault) => {
        const mainElement = document.getElementById('main');
        
        if (isDefault) {
            mainElement?.style.marginTop = '45px';
        } else {
            mainElement?.style.marginTop = '5px';
        }
    }
    
</script>

<style>
    :global(body) {
        font-family: Segoe WPC,Segoe UI,sans-serif;
        font-size: 13px;
        padding-right: 20px;
        overflow-x: hidden;
    }

    input {
        color: var(--vscode-input-foreground);
        background-color: inherit;
        border: 1px solid var(--vscode-input-border, transparent);
        background-color: var(--vscode-input-background);
        height: 24px;
    }

    input:focus{
        outline-offset: -1px;
        outline-color: var(--vscode-input-foreground);
    }

    button {
        color: var(--vscode-button-foreground); 
        background-color: var(--vscode-button-background);
        border: 1px solid var(--vscode-button-border,transparent);
        cursor: pointer;
        box-sizing: border-box;  
        height: 24px;
    }

    button:hover {
        background-color: var(--vscode-button-hoverBackground);
    }

    button:focus {
      outline: none;
  }
    
    div#main{
       min-width: 315px;
       margin-top: 45px;

    }
    #hostname {
       margin-bottom: 10px; 
       width: 100%;
       width: 285px;
       margin-top: 10px;
    }
    #codeVersion {
       margin-bottom: 10px; 
       width: 100%;
       width: 285px;
       margin-top: 10px;
    }
    #userName {
       margin-bottom: 10px; 
       width: 100%;
       width: 285px; 
       margin-top: 10px;
    }
    #password {
       margin-bottom: 10px; 
       width: 100%;
       width: 285px;
       margin-top: 10px;
    }
    
    #btnSvgPassword {
       width: 28px;
       height: 28px;
       left: 310px;
       position: absolute;
       color: var(--vscode-input-foreground);
       background-color: transparent;
       border: none;
       margin-top: 10px;
    }

    #btnSvgPassword:hover {
        background-color: transparent;
    }

    #btnSvgHostname {
       width: 28px;
       height: 28px;
       left: 310px;
       position: absolute;
       color: var(--vscode-input-foreground);
       background-color: transparent;
       border: none;
       margin-top: 10px;
    }

    #btnSvgHostname:hover {
        background-color: transparent;
    }

    #btnSvgCodeversion {
       width: 28px;
       height: 28px;
       left: 310px;
       position: absolute;
       color: var(--vscode-input-foreground);
       background-color: transparent;
       border: none;
       margin-top: 10px;
    }

    #btnSvgCodeversion:hover {
        background-color: transparent;
    }

    .btns-block {
        margin-bottom: 10px; 
    }

    .environmentSettings {
        margin-bottom: 10px; 
    }

    .btn {
        width: 100%;
        width: 315px;
        margin-top: 10px;
    }

    .textInput, .textButton {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        padding: 4px 0 0;
        margin: 0;
        font-size: 12px;
        font-weight: 400;
        font-variant-caps: small-caps;
    }

    #btnCreate, #btnFix {
       margin-top: 20px; 
       width: 100%;
    }

    .buttons-wrapper {
        height: 45px;
        display: flex;
        width: 315px;
        position: fixed;
        top: 0;
        z-index: 999;
        background-color: var(--vscode-sideBar-background);
    }

    .menu-button {
        width: 50%;
        padding: 0;
        color: rgb(92, 92, 92);
        background-color: transparent;
        height: 32px;
        border: none;
    }

    .menu-button:hover {
        background-color: transparent;
    }

    .selected {
        color: var(--vscode-input-foreground);
    }

    .loading {
        position: absolute;
        width: 315px;
        text-align: center;
        display: flex;
        align-content: center;
        justify-content: center;
        align-items: center;
        font-weight: 400;
        font-variant-caps: small-caps;
        font-size: 14px;
        margin-top: 20px;
    }

    .message-text {
        font-weight: 400;
        font-variant-caps: small-caps;
        font-size: 14px;
    }

    .d-none {
        display: none;
    }

</style>    

{#if initialView === 'default'}
    <div class="buttons-wrapper">
        <button class="menu-button selected bracket" on:click={() => { 
            page = 'bracket';
            getInputData();
            updateClass('.bracket', '.settings');
            }}>
            <BracketMenu/>
        </button> 
        <button class="menu-button settings" on:click={() => { 
            page = 'settings';
            updateClass('.settings', '.bracket');
            }}>
            <SettingsMenu/>
        </button> 
    </div>
{/if}

<div id="main">

    {#if initialView === 'default'}

        {#if isLoading}
            <div class='loading'> Loading information from {environment}...</div>
        {/if}

        {#if page === 'bracket'}
            <div class="environmentSettings {isLoading ? 'd-none' : ''}">
                <div>
                    <div class="textInput">Hostname</div>
                    <input on:change={(e)=>{
                        changeProperty(e.target.value, hostnamePropertyShort);
                        changeJsonFile();
                    }} type="text" id="hostname">
            
                    <button id="btnSvgHostname" on:click={()=>{
                        clickBtnHistory(hostnameConstant);
                    }}><svelte:component this={History} /></button>  
            
                </div>
            
                <div>
                    <div class="textInput">Code Version</div>
                    <input on:change={(e)=>{
                        changeProperty(e.target.value, codeversionPropertyShort);
                        changeJsonFile();
                    }} type="text" id="codeVersion">
                            
                    <button id="btnSvgCodeversion" on:click={()=>{
                        clickBtnHistory(codeversionConstant);
                    }}><svelte:component this={History} /></button>  
            
                </div>
            
                <div class="textInput">User Name</div>
                <input on:change={()=>{
                    changeJsonFile();
                }} type="text" id="userName">
            
                <div>
                    <div class="textInput">Password</div>
                    <input on:change={()=>{
                        changeJsonFile();
                    }} type={isPasswordVisible ? "text" : "password"} id="password">
                
                    <button id="btnSvgPassword" on:click={()=>{
                        buttonClick()
                    }}><svelte:component this={componentSelected} /></button>            
                </div>   
            </div>

            <div class="environmentSettings {isLoading ? 'd-none' : ''}">
                <div class="textButton">Environment Links</div>
                <div>
                    <button on:click={()=>{
                        clickBtnLink(true);
                    }} class="btn monaco-button monaco-text-button">Open Business Manager</button>                    
                </div>

                <div>
                    <button on:click={()=>{
                        clickBtnLink(false);
                    }} class="btn monaco-button monaco-text-button">Open StoreFront</button>                    
                </div>
            </div>
        {/if}

        {#if page === 'settings'}    
            {#if isProphetInstalled}                
                <div class="btns-block">
                    <div class="textButton">Environment Settings</div>
                    <div>
                        <button on:click={()=>{
                            clickBtnNewCodeversion();
                        }} class="btn monaco-button monaco-text-button">New Code Version</button>                    
                    </div>
        
                    <div>
                        <button on:click={()=>{
                            clickBtnDeleteCodeversion();
                        }} class="btn monaco-button monaco-text-button">Delete Code Version</button>
                    </div>
                </div>        
            
                {#if isToShowDevBuildBtn || isToShowPrdBuildBtn}
                    <div class="textButton">Compiler</div>
                    <div class="btns-block">
                        {#if isToShowDevBuildBtn}
                            <div>
                                <button on:click={()=>{
                                    clickBtnBuild(textCommandDevBuildBtn);
                                }} class="btn monaco-button monaco-text-button">{textLayoutDevBuildBtn}</button>
                            </div>
                        {/if}

                        {#if isToShowPrdBuildBtn}
                            <div>
                                <button on:click={()=>{
                                    clickBtnBuild(textCommandPrdBuildBtn);
                                }} class="btn monaco-button monaco-text-button">{textLayoutPrdBuildBtn}</button>
                            </div>
                        {/if}
                    </div> 
                {/if}           
            
                <div class="btns-block">
                    <div class="textButton">Commands</div>
                    <div>
                        <button on:click={()=>{
                            clickBtnCleanUpload();
                        }} class="btn monaco-button monaco-text-button">Clean Project / Upload All</button>                    
                    </div>
        
                    <div>
                        <button on:click={()=>{
                            clickBtnEnableUpload();
                        }} class="btn monaco-button monaco-text-button">Enable Upload</button>
                    </div>
        
                    <div>
                        <button on:click={()=>{
                            clickBtnDisableUpload();
                        }} class="btn monaco-button monaco-text-button">Disable Upload</button>
                    </div>
                </div>  

                <div class="btns-block">
                    <div class="textButton">Configuration</div>
                    <div>
                        <button on:click={()=>{
                            clickBtnOpenSettings();
                        }} class="btn monaco-button monaco-text-button">Extention settings</button>                    
                    </div>
                </div>  

            {/if}
        {/if}
    {/if}

    {#if initialView === 'noFile'}

        <p class="message-text">This folder do not has a dw.json file or is not a SFCC project!</p>
        <p class="message-text">If you already have a workspace open, please click on bellow button to create a new dw.json file.</p>

        <!-- svelte-ignore missing-declaration -->
        <button on:click={()=>{
            tsvscode.postMessage({
                type: 'onCreateFile',
                value: true
            });
        }} id="btnCreate" class="monaco-button monaco-text-button btn">Create a dw.json</button>

    {/if}

    {#if initialView === 'noWorkspace'}

        <p class="message-text">Ups... This extensions needs a Workspace to run...</p>
        <p class="message-text">Please open a Workspace.</p>

    {/if}

    {#if initialView === 'schemaError'}

        <p class="message-text">Detected a dw.json file with a schema error!</p>
        <p class="message-text">The properties names are incorrect or not in string format.</p>

        <!-- svelte-ignore missing-declaration -->
        <button on:click={()=>{
            tsvscode.postMessage({
                type: 'onCreateFile',
                value: false
            });
        }} id="btnFix" class="monaco-button monaco-text-button btn">Fix the dw.json</button>

    {/if}
        
</div>




