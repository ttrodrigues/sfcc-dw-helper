<script lang="ts">


    //@ts-ignore    
    // -> import item from 'd:\\Treino\\Wells Validar NIF\\dw.json';

    // let jsonPath: string;

    // document.addEventListener('DOMContentLoaded', (function () {

    // window.addEventListener('message', event => {
    //     const message = event; // The JSON data our extension sent
    //     switch (message.type) {
    //         case 'dataJsonCommand':
    //             jsonPath = message.data;
    //             break;
    //         }
    //     }) 
    // }))


    //@ts-ignore    
    //import item from jsonPath;


//add in onMount
    import { onMount } from 'svelte';
    //attach a function to onMount
    onMount(() => {
        tsvscode.postMessage({
            type: 'init-view',
            value: true
        });
    });
   
    
    export async function preload() {
        const response = await this.fetch('videoslist.json');
        const responseJson = await response.json();
        return {
            videos: responseJson
        }
    }



    
    let hostnameInput:any = document.getElementById('hostname');                 
    hostnameInput.innerText = json?.hostname; 


   
    // To change the visibility of password field
    let isPasswordVisible: boolean = false;     

    const changeJsonFile = () => {
        //@ts-ignore
        const hostname:string = document.getElementById('hostname')?.value;
        //@ts-ignore
        const username:string = document.getElementById('userName')?.value;
        //@ts-ignore
        const password:string = document.getElementById('password')?.value;
        //@ts-ignore
        const codeversion:string = document.getElementById('codeVersion')?.value;

        const jsonContent = {
            "hostname": hostname,
            "username": username,
            "password": password,
            "code-version": codeversion
          };

        console.log(jsonContent);
        
        tsvscode.postMessage({
            type: 'onChangeFile',
            value: jsonContent
        });
    }





    // function windowMessage(event: any) {
    //     const message = event.value; // The json data that the extension sent
    //     switch (message.type) {
    //         case 'json':
    //             if (!message.value) {
    //                 return;
    //             } 

    //             let json = message.value;

    //             let hostnameInput:any = document.getElementById('hostname'); 
                
    //             hostnameInput.innerText = json.hostname;

    //             return;
    //     }
    // }

   



</script>

<style>
    * {
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

    button:hover{
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
    }} id="btnSeePassword" class="monaco-button monaco-text-button">{isPasswordVisible ? "Hide" : "Show"}</button>

</div>

