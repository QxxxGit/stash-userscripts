// ==UserScript==
// @name         Scene Card Redesign
// @namespace    QxxxGit
// @version      0.1
// @description  Redesigns the scene card; adds performers at-a-glance, FPS overlay, view count, and more. Thanks to ilovep4k for design idea and Inter font.
// @author       Qx
// @match        http://localhost:9999/*
// @resource    https://rsms.me/inter/inter.css
// @resource    SCR_CSS https://raw.githubusercontent.com/QxxxGit/stash-userscripts/main/scene-card-redesign/scene-card-redesign.css
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/master/src\StashUserscriptLibrary.js
// @grant       unsafeWindow
// @grant       GM_addStyle
// @grant       GM_getResourceText
// ==/UserScript==

(function() {
    'use strict';

    const Settings = {
        fpsOverlay: true,
        removeOCounterPopover: false,
        removeMarkerPopover: false,

        cssMale: 'lightblue',
        cssTransmale: 'lightblue',
        cssFemale: 'pink',
        cssTransfemale: 'pink',
        cssIntersex: '#DDA0DD',
        cssNonbinary: '#DDA0DD'
    };

    const {
        stash,
        waitForElementClass,
    } = unsafeWindow.stash;

    const isOverflowed = (node) => {
        return node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth;
    }

    // Removes an extra whitespace in the resolution overlay present in Stash's UI,
    // and adds FPS overlay if setting is enabled.
    const updateSceneSpecsOverlay = (parentNode, id, fps) => {
        const overlayId = `soid-${id}`;

        if(document.getElementById(overlayId)) return;

        const specs = parentNode?.querySelectorAll('.scene-specs-overlay')[0];
        specs.setAttribute('id', overlayId);

        if(Settings.fpsOverlay) {
            const fpsNode = document.createElement('span');
            fpsNode.classList.add('overlay-fps');
            fpsNode.innerText = `${Math.round(fps)}FPS`;

            specs.insertBefore(fpsNode, specs.firstChild);
        }

        const durationNode = document.createElement('span');
        durationNode.classList.add('overlay-duration');
        durationNode.innerText = specs.lastChild.textContent;

        specs.replaceChild(durationNode, specs.lastChild);

        for(let node in specs.childNodes) {
            if(isNaN(node)) return;
            if(!specs.childNodes[node]) return;
            if(!specs.childNodes[node].innerText) return;

            specs.childNodes[node].innerText = specs.childNodes[node].innerText.trim();
        }
    };

    // Adds an 'at-a-glance' list of performers. If overflow is reached,
    // a +X more popover appears next to the list.
    const updatePerformers = (parentNode, id, performers) => {
        const performerRowId = `prid-${id}`;

        if(document.getElementById(performerRowId) || performers.length === 0) return;

        const cardSectionNode = parentNode?.querySelectorAll('.card-section')[0];
        const performerListContainer = document.createElement('div');
        performerListContainer.classList.add('scene-performers')
        const performerListNode = document.createElement('div');
        performerListNode.setAttribute('id', performerRowId);
        performerListNode.classList.add('scene-performers-list');

        performerListContainer.appendChild(performerListNode);
        cardSectionNode.insertBefore(performerListContainer, cardSectionNode.firstChild);

        const performerButtonPopover = parentNode?.querySelectorAll('.performer-count')[0];
        performerButtonPopover.querySelectorAll('svg')[0].remove();

        let performerIterator = 0;

        for(let performerIndex in performers) {
            const performer = performers[performerIndex];
            const anchor = document.createElement('a');
            anchor.setAttribute('href', `/performers/${performer.id}`);
            const performerNode = document.createElement('span');
            performerNode.innerText = performer.name;

            if(performer.gender) {
                performerNode.classList.add(performer.gender);
            }

            anchor.appendChild(performerNode);
            performerListNode.appendChild(anchor);

            if(isOverflowed(performerListNode)) {
                performerListNode.removeChild(performerListNode.lastChild);
                
                break;
            }

            performerIterator++;
        }

        if(performers.length > performerIterator) {
            const performersLeft = performers.length - performerIterator;
            performerButtonPopover.innerText = `+${performersLeft} more`;
            performerListContainer.appendChild(performerButtonPopover);
        } else {
            performerButtonPopover.remove();
        }
        
    };

    const updateStudios = (parentNode, studio) => {
        const anchor = document.createElement('a');
        anchor.setAttribute('href', `/studios/${studio?.id}`);

        const studioInfoNode = document.createElement('span');
        studioInfoNode.classList.add('scene-studio');
        studioInfoNode.innerText = studio?.name ?? '';

        anchor.appendChild(studioInfoNode);
        parentNode.appendChild(anchor);
    };

    // Adds view/play counter to card
    const updateViews = (parentNode, viewCount) => {
        viewCount ??= 0;

        const viewCountNode = document.createElement('span');
        viewCountNode.classList.add('scene-view-count');
        viewCountNode.innerText = `${viewCount} views`;

        parentNode.appendChild(viewCountNode);
    }

    const updateDate = (parentNode, date) => {
        if(!date) return;

        const dateParser = new Date(date);
        const month = dateParser.toLocaleString('default', {month: 'short'});
        const day = dateParser.getDate();
        const year = dateParser.getFullYear();

        const dateNode = document.createElement('span');
        dateNode.classList.add('scene-date');
        dateNode.innerText = `${month}. ${day}, ${year}`;

        parentNode.appendChild(dateNode);
    }

    const updatePopovers = (parentNode) => {
        if(Settings.removeMarkerPopover)
            parentNode?.querySelector('.marker-count')?.remove();

        if(Settings.removeOCounterPopover)
            parentNode?.querySelector('.o-count')?.remove();
    }

    const identifySceneId = (sceneCardNode) => {
        const link = sceneCardNode.querySelectorAll('.scene-card-link')[0];

        return link.href.split('/').pop().split('?')[0];
    }

    const display = () => {
        waitForElementClass('scene-card grid-card card', function() {
            const css = GM_getResourceText("SCR_CSS");
            GM_addStyle(css);

            GM_addStyle(`.scene-performers-list span.MALE {
                color: ${Settings.cssMale};
            }
            .scene-performers-list span.TRANSGENDER_MALE {
                color: ${Settings.cssTransmale};
            }
            .scene-performers-list span.FEMALE {
                color: ${Settings.cssFemale};
            }
            .scene-performers-list span.TRANSGENDER_FEMALE {
                color: ${Settings.cssTransfemale};
            }
            .scene-performers-list span.INTERSEX {
                color: ${Settings.cssIntersex};
            }
            .scene-performers-list span.NONBINARY {
                color: ${Settings.cssNonbinary};
            }`);

            const cardContainer = document.querySelectorAll('.scene-card');
            
            for(let cardIndex in cardContainer) {
                if(isNaN(cardIndex)) return;

                const currentCard = cardContainer[cardIndex];
                const sceneId = identifySceneId(currentCard);

                const infoNodeId = `info-${sceneId}`;
                if(document.getElementById(infoNodeId)) return;

                const scene = stash.scenes[sceneId];
                const infoNode = document.createElement('div');
                infoNode.setAttribute('id', infoNodeId);
                infoNode.classList.add('scene-info');

                const studioOverlay = currentCard.querySelector('.scene-studio-overlay');
                if(studioOverlay) {
                    studioOverlay.remove();
                }

                updateSceneSpecsOverlay(currentCard, scene.id, scene.files[0].frame_rate);
                updatePerformers(currentCard, scene.id, scene.performers);
                updateStudios(infoNode, scene.studio);
                updateViews(infoNode, scene.play_count);
                updateDate(infoNode, scene.date);

                const cardSectionNode = currentCard.querySelectorAll('.card-section')[0];
                cardSectionNode.appendChild(infoNode);

                updatePopovers(currentCard);
            }
        });
    };

    stash.addEventListener('page:scenes', () => display());
    stash.addEventListener('page:studio:scenes', () => display());
    stash.addEventListener('page:performer:scenes', () => display());
    stash.addEventListener('page:tag:scenes', () => display());
})();
