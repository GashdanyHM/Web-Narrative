// story_data.js
const story = {
    // --- 【游戏特殊场景】 ---
    'mainMenu': {
        type: 'mainMenu',
    },

    'achievements': {
        type: 'achievements'
    },

    // 结局后的循环 CG 节点
    'loopingCG': {
        type: 'loopingCG',       // 场景类型
        duration: 1500,          // 持续时间 (1.5秒)
        target: 'start'          // 结束后跳转到 'start' 节点
    },

    // --- 【游戏故事起点】 ---
    'start': {
        type: 'actionSelection',
        background: 'scene_bedroom_morning',
        dialogue: '[Alarm] Beep Beep Beep...',
        choices: [
            { text: 'Get Up', target: 'location_select_morning' },
            { text  : 'Snoozzzze...', target: 'snooze_midday' }
        ]
    },
    'snooze_midday': {
        type: 'actionSelection',
        background: 'scene_bedroom_midday',
        dialogue: 'You drift back to sleep. The sun is higher in the sky now.',
        choices: [
            { text: 'Get Up', target: 'location_select_midday' },
            { text: 'Snooze', target: 'snooze_night' }
        ]
    },
    'snooze_night': {
        type: 'actionSelection',
        background: 'scene_bedroom_night',
        dialogue: 'Darkness falls. The day is gone. Perhaps... forever?',
        choices: [
            { text: 'Get Up', target: 'location_select_night' },
            { text: 'Snooze', target: 'ending_eternal_sleep' }
        ]
    },
    
    'ending_eternal_sleep': {
        type: 'ending',
        endingTitle: 'END 1: Eternal Sleep',
        endingImage: 'ending_eternalSleep',
        dialogue: 'You chose sleep over the world. A deep, endless, dreamless sleep. You are finally at peace.',
    },

    'location_select_morning': {
        type: 'locationSelection',
        background: 'scene_bedroom_morning',
        locations: [
        { name: 'Dressing',   target: null,    image: 'placeholder_dressing' },
        { name: 'Bathroom',   target: 'bathroom_options',    image: 'placeholder_bathroom' },
        { name: 'Cactus',     target: 'cactus_options',      image: 'placeholder_cactus' },
        { name: 'Window',     target: 'window_options',      image: 'placeholder_window' },
        { name: 'Kitchen',    target: null,                  image: 'placeholder_kitchen' }, 
        { name: 'Desk',       target: null,                  image: 'placeholder_desk' },
        { name: 'Bed',        target: 'ending_didntGetUp',         image: 'placeholder_bed' },
        { name: 'Leave Home', target: null,                  image: 'placeholder_door' }
        ]
    },
    'location_select_midday': {
        type: 'locationSelection',
        background: 'scene_bedroom_midday',
        locations: [
        { name: 'Dressing',   target: null,    image: 'placeholder_dressing' },
        { name: 'Bathroom',   target: 'bathroom_options',    image: 'placeholder_bathroom' },
        { name: 'Cactus',     target: 'cactus_options',      image: 'placeholder_cactus' },
        { name: 'Window',     target: 'window_options',      image: 'placeholder_window' },
        { name: 'Kitchen',    target: null,                  image: 'placeholder_kitchen' },
        { name: 'Desk',       target: null,                  image: 'placeholder_desk' },
        { name: 'Bed',        target: 'ending_didntGetUp',         image: 'placeholder_bed' },
        { name: 'Leave Home', target: null,                  image: 'placeholder_door' }
        ]
    },
    'location_select_night': {
        type: 'locationSelection',
        background: 'scene_bedroom_night',
        locations: [
        { name: 'Dressing',   target: null,    image: 'placeholder_dressing' },
        { name: 'Bathroom',   target: 'bathroom_options',    image: 'placeholder_bathroom' },
        { name: 'Cactus',     target: 'cactus_options',      image: 'placeholder_cactus' },
        { name: 'Window',     target: 'window_options',      image: 'placeholder_window' },
        { name: 'Kitchen',    target: null,                  image: 'placeholder_kitchen' },
        { name: 'Desk',       target: null,                  image: 'placeholder_desk' },
        { name: 'Bed',        target: 'ending_didntGetUp',         image: 'placeholder_bed' },
        { name: 'Leave Home', target: null,                  image: 'placeholder_door' }
        ]
    },

    'bathroom_options': {
        type: 'actionSelection',
        background: 'scene_bathroom',
        dialogue: 'The bathroom. A place of reflection.',
        choices: [
            { text: 'Brush & Wash', target: 'location_select_morning', action: 'update:cleanliness:true' },
            { text: 'Use Toilet', target: 'toilet_sequence' },
            { text: 'Back', target: 'location_select_morning' }
        ]
    },
    'toilet_sequence': {
        type: 'actionSelection',
        background: 'scene_bathroom',
        dialogue: 'You feel the urge...',
        choices: [
            { text: 'Poop', target_conditional: [
                {condition: 'hasPoop:true', target: 'toilet_poop_check'},
                {condition: 'default', target: 'toilet_no_more'}
            ]},
            { text: 'Back', target: 'bathroom_options' }
        ]
    },
     'toilet_no_more': {
        type: 'actionSelection',
        background: 'scene_bathroom',
        dialogue: "There's no more!",
        choices: [
            { text: 'Back', target: 'bathroom_options' }
        ]
    },
    'toilet_poop_check': {
        type: 'actionSelection',
        background: 'scene_bathroom',
        dialogue: 'You finished your business. But did you remember to clean up properly?',
        action: 'update:hasPoop:false',
        target_conditional: [
            { condition: 'cleanliness:true', target: 'toilet_success' },
            { condition: 'default', target: 'ending_oh_shit' }
        ]
    },
    'toilet_success': {
        type: 'actionSelection',
        background: 'scene_bathroom',
        dialogue: 'Success! You feel refreshed and clean.',
        choices: [
            { text: 'Back to Bathroom', target: 'bathroom_options' }
        ]
    },
    'ending_oh_shit': {
        type: 'ending',
        endingTitle: 'END 2: Oh Shit',
        endingImage: 'ending_ohShit',
        dialogue: 'You forgot to wash your hands. The consequences were... dire.',
    },

    'cactus_options': {
        type: 'actionSelection',
        background: 'scene_cactus',
        dialogue: 'Your little cactus friend. It looks thirsty.',
        choices: [
            { text: 'Water it', target: 'cactus_water_check', condition: 'cactusAlive:true' },
            { text: 'Pet it', target: 'ending_tooBad', condition: 'cactusAlive:true' },
            { text: 'Mourn it', target: 'cactus_options', condition: 'cactusAlive:false' },
            { text: 'Back', target: 'location_select_morning' }
        ]
    },
    'cactus_water_check': {
        type: 'actionSelection',
        background: 'scene_cactus',
        dialogue: 'You give the cactus some water.',
        action: 'increment:cactusLife',
        target_conditional: [
            { condition: 'cactusLife:>=:2', target: 'cactus_drown' },
            { condition: 'default', target: 'cactus_options' }
        ]
    },
    'cactus_drown': {
        type: 'actionSelection',
        background: 'scene_cactus',
        dialogue: 'You gave it too much water! The cactus has drowned.',
        action: 'update:cactusAlive:false',
        target: 'ending_cactusDrowned'
    },
    'ending_cactusDrowned': {
        type: 'ending',
        endingTitle: 'END 3: Overwatered',
        endingImage: 'ending_cactusDrowned',
        dialogue: 'You loved your cactus a little too much. It has drowned.'
    },
    'ending_tooBad': {
        type: 'ending',
        endingTitle: 'END 4: Too Bad',
        endingImage: 'ending_tooBad',
        dialogue: 'The cactus did not enjoy being pet. It pricked you. You died.'
    },

    'window_options': {
        type: 'actionSelection',
        background: 'scene_window',
        dialogue: 'The window is shut. A vast world lies outside.',
        choices: [
            { text: 'Open it', target: 'window_open_dialogue' },
            { text: 'Keep it shut', target: 'location_select_morning' }
        ]
    },
    'window_open_dialogue': {
        type: 'actionSelection',
        background: 'scene_window',
        dialogue: 'You open the window. A breeze comes in.',
        choices: [
            { text: 'Jump out', target: 'fly_or_die_dialogue' },
            { text: 'Close it', target: 'window_options' }
        ]
    },
    'fly_or_die_dialogue':{
        type: 'actionSelection',
        background: 'scene_window',
        dialogue: 'You think you can fly?',
        choices: [
            { text: 'Yes', target: null}, // Not implemented
            { text: 'No', target: 'ending_didntGetUp' } // Placeholder ending
        ]
    },
    
    'ending_didntGetUp': {
        type: 'ending',
        endingTitle: "END 5: Didn't even try",
        endingImage: 'ending_didntGetUp',
        dialogue: "You got up... just to go back to bed. The world can wait. Or maybe it can't.",
    }
};

// --- 【核心修正】所有结局的总览，键名需要和上面的结局ID完全一样 ---
const allEndings = {
  'ending_eternal_sleep': {
    title: 'END 1: Eternal Sleep',
    description: 'You chose sleep over the world.'
  },
  'ending_oh_shit': {
    title: 'END 2: Oh Shit',
    description: 'You forgot to wash your hands after pooping.'
  },
  'ending_cactusDrowned': {
    title: 'END 3: Overwatered',
    description: 'You loved your cactus a little too much.'
  },
  'ending_tooBad': {
    title: 'END 4: Too Bad',
    description: 'The cactus did not enjoy being pet.'
  },
  'ending_didntGetUp': {
    title: "END 5: Didn't even try",
    description: 'You got up just to go back to bed.'
  },
};
