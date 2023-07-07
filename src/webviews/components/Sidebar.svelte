<script lang="ts">
    
    // @ts-nocheck
    
    import { onMount } from 'svelte';
    import ShowIcon from './ShowIcon.svelte';
    import HideIcon from './HideIcon.svelte';
    import History from './History.svelte';
    import CollapsibleSection from './CollapsibleSection.svelte';

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
    
    function buttonClick() {
        isPasswordVisible = !isPasswordVisible;
        componentSelected = isPasswordVisible ? HideIcon : ShowIcon;
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
        border: none;
        background-color: var(--vscode-input-background);
        height: 28px;
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
        height: 28px;
    }

    button:hover {
        background-color: var(--vscode-button-hoverBackground);
    }

    button:focus {
      outline: none;
  }
    
    div#main{
       min-width: 315px;
       margin-top: 5px;
    }
    #hostname {
       margin-bottom: 10px; 
       width: 100%;
       width: 285px;
    }
    #codeVersion {
       margin-bottom: 10px; 
       width: 100%;
       width: 285px;
    }
    #userName {
       margin-bottom: 10px; 
       width: 100%;
       width: 285px; 
    }
    #password {
       margin-bottom: 10px; 
       width: 100%;
       width: 285px;
    }
    
    #btnSvgPassword {
       width: 28px;
       height: 28px;
       left: 310px;
       position: absolute;
       color: transparent;
       background-color: transparent;
    }

    #btnSvgPassword:hover {
        background-color: transparent;
    }

    #btnSvgHostname {
       width: 28px;
       height: 28px;
       left: 310px;
       position: absolute;
       color: transparent;
       background-color: transparent;
    }

    #btnSvgHostname:hover {
        background-color: transparent;
    }

    #btnSvgCodeversion {
       width: 28px;
       height: 28px;
       left: 310px;
       position: absolute;
       color: transparent;
       background-color: transparent;
    }

    #svgLogoHistoryHostname {
        left: 313px;
        position: absolute;
        top: 47px;
    }

    #svgLogoHistoryCodeversion {
        left: 313px;
        position: absolute;
        top: 113px;
    }

    #svgLogoPassword {
        left: 313px;
        position: absolute;
        top: 245px;
    }

    #btnSvgCodeversion:hover {
        background-color: transparent;
    }

    #prophetBtn {
        margin-bottom: 10px; 
    }
    
    #commandsBtn {
        margin-bottom: 10px; 
    }

    #environmentBtns {
        margin-bottom: 10px; 
    }

    .btn-prophet {
        width: 100%;
        width: 315px;
        margin-top: 10px;
    }

    .btn-build {
        width: 100%;
        width: 315px;
        margin-top: 10px;
    }

    .textInput {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        padding: 4px 0 0;
        margin: 0;
        font-size: 11px;
        font-weight: 400;
    }

</style>       

<div id="main">

    <CollapsibleSection headerText={'Environment'} expanded={true}>
        <div id="environmentBtns">
            <div>
                <div class="textInput">Hostname</div>
                <input on:change={(e)=>{
                    changeProperty(e.target.value, hostnamePropertyShort);
                    changeJsonFile();
                }} type="text" id="hostname">
        
                <div id="svgLogoHistoryHostname">
                    <svelte:component this={History} />
                </div>

                <button id="btnSvgHostname" on:click={()=>{
                    clickBtnHistory(hostnameConstant);
                }}></button>  
        
            </div>
        
            <div>
                <div class="textInput">Code Version</div>
                <input on:change={(e)=>{
                    changeProperty(e.target.value, codeversionPropertyShort);
                    changeJsonFile();
                }} type="text" id="codeVersion">
                        
                <div id="svgLogoHistoryCodeversion">
                    <svelte:component this={History} />
                </div>

                <button id="btnSvgCodeversion" on:click={()=>{
                    clickBtnHistory(codeversionConstant);
                }}></button>  
        
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
            
                <div id="svgLogoPassword">
                    <svelte:component this={componentSelected} />
                </div>

                <button id="btnSvgPassword" on:click={()=>{
                    buttonClick()
                }}></button>            
            </div>   
        </div>
    </CollapsibleSection>
        
    {#if isProphetInstalled}
        <CollapsibleSection headerText={'Compiler'} expanded={true}>
            <div id="commandsBtn">
                {#if isToShowDevBuildBtn}
                    <div>
                        <button on:click={()=>{
                            clickBtnBuild(textCommandDevBuildBtn);
                        }} class="btn-build monaco-button monaco-text-button">{textLayoutDevBuildBtn}</button>
                    </div>
                {/if}

                {#if isToShowPrdBuildBtn}
                    <div>
                        <button on:click={()=>{
                            clickBtnBuild(textCommandPrdBuildBtn);
                        }} class="btn-build monaco-button monaco-text-button">{textLayoutPrdBuildBtn}</button>
                    </div>
                {/if}
            </div>            
        </CollapsibleSection>

        <CollapsibleSection headerText={'Commands'} expanded={true}>
            <div id="prophetBtn">
                <div>
                    <button on:click={()=>{
                        clickBtnCleanUpload();
                    }} class="btn-prophet monaco-button monaco-text-button">Clean Project / Upload All</button>                    
                </div>
    
                <div>
                    <button on:click={()=>{
                        clickBtnEnableUpload();
                    }} class="btn-prophet monaco-button monaco-text-button">Enable Upload</button>
                </div>
    
                <div>
                    <button on:click={()=>{
                        clickBtnDisableUpload();
                    }} class="btn-prophet monaco-button monaco-text-button">Disable Upload</button>
                </div>
            </div>        
        </CollapsibleSection>    
    {/if}
        
</div>




