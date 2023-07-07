<script>
    export let headerText;
    export let expanded;
</script>

<div class="collapsible">
  <h3>
    <button aria-expanded={expanded} on:click={() => expanded = !expanded}>{headerText}
      <svg class="svgIcon" viewBox="0 0 20 20" fill="none" >
        <!-- Open icon - codicon-chevron-down -->
        <path class="openSection" stroke="currentColor" stroke-width="1.5" fill-rule="evenodd" clip-rule="evenodd" d="M7.976 10.072l4.357-4.357.62.618L8.284 11h-.618L3 6.333l.619-.618 4.357 4.357z"></path>
        <!-- Close icon - codicon-chevron-up -->
        <path class="closeSection" stroke="currentColor" stroke-width="1.5" fill-rule="evenodd" clip-rule="evenodd" d="M8.024 5.928l-4.357 4.357-.62-.618L7.716 5h.618L13 9.667l-.619.618-4.357-4.357z"></path>
      </svg>
    </button>
  </h3>     
    <div class='contents' hidden={!expanded}>
        <slot></slot>
    </div>
</div>

<style>
  .collapsible {
    line-height: 22px; 
    color: var(--vscode-icon-foreground);
  }
	
	h3 {
		margin-left: -20px;
    margin-right: -20px;
    margin-top: 0;
    margin-bottom: 0;
	}
	
  button {
    background-color: var(--vscode-sideBarSectionHeader-background);
    color: var(--vscode-sideBarSectionHeader-foreground, var(--vscode-foreground));
    display: flex;
		justify-content: space-between;
    width: 100%;
		border: none;
    height: 22px;
    text-transform: uppercase;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    font-size: 11px;
    min-width: 3ch;
    font-weight: bold;
    padding: 0;
    cursor: pointer;
    align-items: center;
    padding-left: 20px;
    margin-bottom: 0;
  }

  button:focus {
      outline: none;
  }

  button[aria-expanded="true"] .openSection {
      display: none;
  }

  button[aria-expanded="false"] .closeSection {
      display: none;
  }

  svg {
    height: 22px;
    width: 17px;
  }

  .svgIcon {
    left: 3px;
    position: fixed;
    padding-top: 3px;
  }
</style>

