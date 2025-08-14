<svelte:options customElement="select-character" />

<script lang="ts">
    import type {CharacterDto} from '$lib/client/types.gen'
    let {characters}: {characters: CharacterDto[]} = $props();
    let isGridVisible = $state<boolean>(false);
    let selectCharacter = $state<CharacterDto>(characters[0]?characters[0]:null);
    const NESTJS_BASE_URL = "https://localhost:3000"
    function dispatch(type){
        $host().dispatchEvent(new CustomEvent(type,))
    }
</script>

<div class="component-select-character">
    <button class="btn-character" onclick={() => {
            isGridVisible = !isGridVisible;
        }}>
        <img src={NESTJS_BASE_URL+selectCharacter.iconFilePath} alt={selectCharacter.name}>
    </button>
    {#if isGridVisible}
        <div class="overlay"
            role="button"
            tabindex="0"
            onclick={()=>{isGridVisible=false}} 
            onkeydown={(event)=>{
                if(event.key == 'Escape'){
                    isGridVisible=false;
                }
            }}></div>
        <div class="grid-select-character">
            {#each characters as character}
                <button class="btn-character" onclick={() => {
                    selectCharacter = character;
                    $host().dispatchEvent(new CustomEvent("selectCharacter",{
                        detail:{
                            character: character
                        }
                    }));
                    isGridVisible = !isGridVisible;
                }}>
                    <img src={NESTJS_BASE_URL+character.iconFilePath} alt={character.name}>
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .component-select-character{
        position: relative;
    }
    .btn-character{
        width: 8vw;
        height: 8vw;
        aspect-ratio: 1/1;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: oklch(9 0.02 267.56);
        img{
            border: 2px solid;
            border-color: black;
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
        }
    }
    .grid-select-character{
        background-color: oklch(0.27 0.02 264.15);
        position: absolute;
        top: 8vw; /* 垂直居中 */
        left: 0; /* 水平居中 */
        /* transform: translate(-50%, -50%); 微調使完全居中 */
        height: 35vw;
        width: 56vw;
        display: flex;
        flex-wrap: wrap;
        /* overflow-y: scroll; */
        z-index: 1000;
    }
    .overlay{
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.3);
        z-index: 999;
    }
</style>