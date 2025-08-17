<svelte:options customElement="switch-controller-type"/>

<script lang="ts">
    import Classic from '$lib/images/controller_type/SF6_Classic.webp';
    import Modern from '$lib/images/controller_type/SF6_Modern.webp';
    // Svelte 5 rune mode
    let {isModern = false}: {
        isModern?: boolean
	} = $props();
    function toggle(){
        isModern = !isModern
        $host().dispatchEvent(
            new CustomEvent('switchControllerType',{
                detail: {
                    controllerType: isModern ? "MODERN" : "CLASSIC"
                }
            })
        );
    }
</script>

<div class="switch-controller-type">
    <img src={Classic} alt="controller-type-classic" class="icon"/>
    <label class="switch" >
        <input type="checkbox" checked={isModern} onchange={toggle} />
        <span class="slider"></span>
    </label>
    <img src={Modern} alt="controller-type-modern" class="icon" />
</div>

<style>
    .switch-controller-type{
        display: flex;
        flex-direction: row;
        align-items: center;
        height: 100%;
        width: 100%;
        .switch{
            width: 40%;
            position: relative;
            height: 40%;
            input{
                width: 0;
                height: 0;
                opacity: 0;
            }
            .slider{
                position: absolute;
                cursor: pointer;
                width: 100%;
                height: 100%;
                top: 0;left: 0;right: 0;bottom: 0;
                background-color: oklch(0.48 0.03 266.65);
                transition: background-color 0.2s ease;
            }
            .slider:before{
                content: "";
                position: absolute;
                width: 40%;
                height: 100%;
                background-color: white;
                transition: .4s;
            }
        }
        input:checked + .slider:before{
            transform: translateX(150%);
        }
        img{
            width: 30%;
        }        
    }
</style>