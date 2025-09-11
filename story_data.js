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
        type: 'cgScene',    // 场景类型
        duration: 2000,     // 持续时间 (1.5秒)
        target: 'start',    // 结束后跳转到 'start' 节点
        sfx: 'sfx_blanket'
    },

    // --- 【游戏故事起点】 ---
    'start': {
        type: 'actionSelection',
        background: 'inbed_morning',
        dialogue: '[Alarm] Beep Beep Beep...',
        bgm: 'bgm_alarm1', // 在此场景循环播放背景音乐
        choices: [
            { text: 'Get Up', target: 'getting_up_cg' },
            { text  : 'Snooze...', target: 'snooze_midday' }
        ]
    },

    'getting_up_cg': { // 起床朦胧睡眼 CG
        type: 'cgScene',
        duration: 2000,     // 持续1.2秒
        image: 'cg_getUp',
        sfx: 'sfx_yawn',
        target: 'location_select_inside'
    },
    'snooze_midday': {
        type: 'actionSelection',
        background: 'inbed_noon', 
        bgm: 'bgm_alarm2',
        dialogue: 'You drift back to sleep. The sun is higher in the sky now.',
        choices: [
            { text: 'Get Up', target: 'getting_up_cg' },
            { text: 'Snoozzze...', target: 'snooze_night' }
        ]
    },
    'snooze_night': {
        type: 'actionSelection',
        background: 'inbed_night',
        dialogue: 'Darkness falls. The day is gone. Perhaps... forever?',
        bgm:'bgm_alarm2',
        choices: [
            { text: 'Get Up', target: 'getting_up_cg' },
            { text: 'Snoozzzzzzz,,,', target: 'ending_eternal_sleep' }
        ]
    },
    
    'ending_eternal_sleep': {
        type: 'ending',
        endingTitle: 'END 1: Me, Bed, Forever',
        endingImage: 'ending_eternalSleep',
        dialogue: 'Why get up if I can live happily with my comfy pillow and warm blanket forever? Hehehee...',
    },

    'location_select_inside': {
        type: 'locationSelection',
        background: 'insideOptions',
        locations: [
        { name: 'Bathroom', target: 'bathroom_options', image: 'scene_bathroom' },
        { name: 'Cactus', target: 'cactus_entry_check', image: 'scene_cactus' },
        { name: 'Window', target: 'window_options', image: 'scene_window' },
        { name: 'Kitchen', target: 'kitchen_options', image: 'scene_kitchen' }, 
        //{ name: 'Desk', target: 'desk_options', image: 'scene_desk' },
        { name: 'Bed', target: 'bed_options', image: 'scene_bed' },
        { name: 'Leave Home', target: 'location_select_outside', image: 'scene_door' }
        ]
    },

// Inside location options
// --- 浴室选项场景 ---
    'bathroom_options': {
        type: 'actionSelection',
        background: 'scene_bathroom',
        dialogue: 'The bathroom. A place of reflection.',
        choices: [
            { text: 'Brush & Wash', target: 'bathroom_options', action: 'update:cleanliness:true' },
            { text: 'Use Toilet', target: 'poop' },
            { text: 'Back', target: 'location_select_inside' }
        ]
    },
    'poop': {
        type: 'actionSelection',
        background: 'scene_bathroom',
        dialogue: 'You feel the urge...',
        choices: [
            { text: 'Poop', target_conditional: [
                {condition: 'hasPoop:true', target: 'toilet_poop_check'},
                {condition: 'default', target: 'toilet_no_more'}
            ]},
            { text: 'Back', target_conditional: [
                {condition: 'hasPoop:false', target: 'bathroom_options'},
                {condition: 'hasPoop:true', target: 'damnYouChooseToHold'}
            ]}
        ]
    },
    'damnYouChooseToHold': {
        type: 'actionSelection',
        background: 'scene_bathroom',
        dialogue: ["?????","You're at this point and you choose to hold it?"],
        choices: [
            { text:'Yes, I insist', target:'bathroom_options' },
            { text:'No, I changed my mind', target:'toilet_poop_check' },
            {text: 'Why do you even care?', target:'holdPoop_fineYouWin'}
        ]
    },
    'holdPoop_fineYouWin': {
        type: 'actionSelection',
        background: 'scene_bathroom',   
        dialogue: ["...Damn","All right, you win."],
        action: 'update:hasPoop:false',
        target: 'toilet_poop_check'
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
        dialogue: 'You finished your business.',
        action: 'update:hasPoop:false',
        target_conditional: [
            //{ condition: 'cleanliness:true', target: 'toilet_success' },
            { condition: 'default', target: 'toilet_success' }
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

// --- 仙人掌 ---
    'cactus_entry_check':{
        type:'actionSelection',
        target_conditional: [
            // 先判断是否有灵魂，否的话就去判定仙人掌本身的状态
            { condition: 'lordCactusAlive:false', target:'cactusLifeCheck'},
            // 然后判断是否出生了
            { condition: 'lordCactusBorn:true', target: 'cactus_blood_pet_scene' },
            // 再判断：仙人掌是否还活着？
            { condition: 'cactusAlive:false', target: 'cactus_drowned_scene' },
            // 如果以上都不是，则进入默认的存活场景
            { condition: 'default', target: 'cactus_alive_scene' }            
        ]
    },
    'cactusLifeCheck':{
        type: 'actionSelection',
        target_conditional :[
            {condition: 'cactusAlive:true', target: 'cactus_alive_scene'},
            {condition: 'default', target: 'cactus_drowned_scene'}
        ]
    },
    'cactus_drowned_scene':{
        type: 'actionSelection',
        background: 'scene_drowned_cactus',
        dialogue:["......",
        "Yes, you had a cactus."],
        action:'update:cactusAlive:false',
        choices:[
            { text: 'Water it', target: 'cactus_drowned_care_again' }, 
            { text: 'Pet it', target: 'cactus_drowned_care_again'},
            { text: 'Back', target: 'location_select_inside' }
        ]

    },
    'cactus_drowned_care_again':{
        type: 'actionSelection',
        background: 'scene_drowned_cactus',
        dialogue: ["......","You know it's useless."],
        target: 'cactus_drowned_scene'
    },
    'cactus_alive_scene': {
        type: 'actionSelection',
        background: 'scene_cactus',
        dialogue: 'Yes, you have a cactus.',
        choices: [
            { text: 'Water it', action:'increment:cactusWatered', target: 'cactus_water_check' },
            { text: 'Pet it', action:'update:cactusPetted:true', target: 'cactus_petting_check'},
            { text: 'Back', target: 'location_select_inside' }
        ]
    },
    'cactus_water_check': {
        type: 'actionSelection',
        background: 'water_cactus',
        sfx: 'sfx_water',
        dialogue: 'You gave the cactus some water.',
        target_conditional: [
            { condition: 'cactusWatered:>=:3', target: 'cactus_drowned_scene' },
            { condition: 'cactusPetted:true', target: 'cactus_lord_born_scene_check' },
            { condition: 'default', target: 'cactus_alive_scene' }
        ]
    },
    'cactus_petting_check': {
        type: 'actionSelection',
        background: 'pet_cactus',
        dialogue: ['You gently pet the cactus.',
            'Ouch!',
            'Stung by its spines, there\'s a strange connection forming...'
        ],
        target_conditional: [
            { condition: 'cactusWatered:==:0', target: 'cactus_alive_scene' },
            { condition: 'cactusWatered:<=:2', target: 'cactus_lord_born_scene_check' },
            { condition: 'default', target: 'cactus_alive_scene' }
        ]
    },
    'cactus_lord_born_scene_check':{
        type: 'actionSelection',
        target_conditional: [
            { condition: 'lordCactusAlive:true', target: 'cactus_lord_born_scene' },
            { condition: 'default', target: 'cactus_lord_rebirth_fail' }
        ]
    },

    'cactus_lord_born_scene': {
        type: 'actionSelection',
        background: 'cactus_blood_pet_scene',
        dialogue: [
            {speaker:'Bloody Red Lord', line:'You, have shown great care for me.'},
            {speaker:'Bloody Red Lord', line:'I, reward you with my presence.'},
            {speaker:'Bloody Red Lord', line:'From now on, I shall be your companion.'}
        ],

        target: 'update_lord_status_and_exit'
    },
    'update_lord_status_and_exit': {
        type: 'actionSelection',
        action: 'update:lordCactusBorn:true',
        target: 'location_select_inside'
    },
    'cactus_blood_pet_scene': {
        type: 'actionSelection',
        background: 'cactus_blood_pet',
        dialogue: [{speaker:'Bloody Red Lord', line:'Let\'s get going.'}],
        target: 'location_select_inside'
    },
    'cactus_lord_rebirth_fail':{
        type: 'actionSelection',
        background: 'scene_drowned_cactus',
        dialogue: ["You took great care of your cactus, and it's growing healthily. But that special connection seems to be lost forever."],
        action:'unlockFaq',
        target:'cactus_alive_scene'
    },

// 【示例】假设有一个让魔宠死亡的事件节点
'event_lord_cactus_dies': {
    type: 'actionSelection',
    dialogue: '在一次意外中，你的仙人掌魔宠...消失了。',
    // 这个节点现在只负责显示对话，然后跳转到下一个专门执行动作的节点
    target: 'execute_lord_death_action'
},

// 【新增】一个纯粹的逻辑节点，用于执行动作并跳转
'execute_lord_death_action': {
    type: 'actionSelection',
    // 这个节点没有对话，引擎会自动跳过它
    action: 'lordDies;update:cactusAlive:false',
    target: 'location_select_inside'
},

    // --- 窗户 ---
    'window_options': {
        type: 'actionSelection',
        background: 'scene_window',
        dialogue: 'The window is shut. A vast world lies outside.',
        choices: [
            { text: 'Open it', target: 'window_open_dialogue' },
            { text: 'Keep it shut', target: 'location_select_inside' }
        ]
    },
    'window_open_dialogue': {
        type: 'actionSelection',
        background: 'scene_window',
        bgm: 'bgm_breeze',
        dialogue: 'You open the window. A breeze comes in.',
        choices: [
            { text: 'Jump out', target: 'fly_or_die_dialogue' },
            { text: 'Close it', target: 'window_options' }
        ]
    },
    'fly_or_die_dialogue':{
        type: 'actionSelection',
        bgm: 'bgm_breeze',
        background: 'scene_jumpedOut',
        dialogue: 'You think you can fly?',
        choices: [
            { text: 'Yes', target: 'cg_wing', action:'unlockAchievement:fly'},
            { text: 'No', target: 'ending_didntGetUp' } // Placeholder ending
        ]
    },
    'cg_wing':{
        type: 'cgScene',    // 场景类型
        duration: 2000,     // 持续时间 (1.5秒)
        image: 'cg_wing',
        target: 'fly_locationOptions',    // 结束后跳转到 'start' 节点
        sfx: 'sfx_wingFlap',
        action:'unlockAchievement:fly'
    },
    'fly_locationOptions':{
        type: 'locationSelection',
        background:'fly_locationOptions',
        locations: [
        //{ name: 'Street', target: 'street_scene', image: 'scene_street' },
        //{ name: 'School', target: 'school_scene', image: 'scene_school' },
        { name: 'Store', target: 'store_options', image: 'scene_storeOutside' },
        { name: 'Hiking', target: 'hiking_scene', image: 'scene_hike' }, 
        { name: 'Amusement Park', target: 'park_options', image: 'scene_amusement' },
        { name: 'Home', target: 'location_select_inside',  image: 'scene_door' },
        { name: 'Space', target: 'space_scene', image: 'scene_space'}
        ]
    },
    //park
    'park_options':{
        type: 'actionSelection',
        background: 'scene_insidePark',
        dialogue:[{speaker:'Author', line:'Sorry, this area is still under construction.'}],
        choices:[
            {text: 'Back', target: 'location_select_outside'}
        ]
    },
    // hiking
    'hiking_scene':{
        type: 'actionSelection',
        background: 'scene_hike',
        dialogue: "What a nice day~",
        choices:[
            {text: 'Picnic table', target: 'meetInsectoid'},
            {text: 'Aim for the top!', target: 'endingSunset' }
        ]
    }, 
    'meetInsectoid':{
        type:'actionSelection',
        background: 'scene_meetInsectoid',
        dialogue: [
            {speaker:'Insectoid kid', line: "Hello! Want some food?"}
        ],
        choices:[
            //{text: 'Attack', target: 'LordDeath'},
            {text: 'Sure', target: 'endingFoodPoisoning'},
            {text: 'No thanks', target: 'hiking_scene'}
        ]
    },
    'endingFoodPoisoning':{
        type:'ending',
        endingTitle: "END 6: Don't eat Stranger's Food",
        endingImage:'ending_toilet',
        dialogue: ".....Shit..!"
    },
    'endingSunset':{
        type: 'ending',
        endingTitle: "END 4: A Beautiful Sunset",
        endingImage: 'ending_Sunset',
        dialogue: "Isn't it beautiful?",
    },
    // kitchen
    'kitchen_options':{
        type: 'actionSelection',
        background: 'scene_kitchen',
        dialogue:[{speaker:'Author', line:'Sorry, this area is still under construction.'}],
        choices:[
            {text: 'Back', target: 'location_select_inside'}
        ]
    },
    'ending_didntGetUp': {
        type: 'ending',
        endingTitle: "END 5: Didn't even try",
        endingImage: 'ending_didntGetUp',
        dialogue: "You got up... just to go back to bed. The world can wait.",
    },
    'bed_options': {
        type: 'actionSelection',
        background: 'scene_bed',
        dialogue: 'Back to bed?',
        choices: [
            { text: 'Yes', target: 'ending_didntGetUp' },
            { text: 'No', target: 'location_select_inside' }
        ]
    },

    // 'desk_options': {
    //     type: 'actionSelection',
    //     background: 'scene_desk',
    //     dialogue: 'Your desk is cluttered with papers and a computer.',
    //     choices: [
    //         { text: 'Work on computer', target: 'event_lord_cactus_dies' },  // for 测试！！！！！
    //         { text: 'Organize papers', target: null },
    //         { text: 'Back', target: 'location_select_inside' }
    //     ]
    // },

    //室外
    'location_select_outside': {
        type: 'locationSelection',
        background: 'location_select_outside',
        locations: [
        //{ name: 'Street', target: 'street_scene', image: 'scene_street' },
        //{ name: 'School', target: 'school_scene', image: 'scene_school' },
        { name: 'Store', target: 'store_options', image: 'scene_storeOutside' },
        { name: 'Hiking', target: 'hiking_scene', image: 'scene_hike' }, 
        { name: 'Amusement Park', target: 'park_options', image: 'scene_amusement' },
        { name: 'Home', target: 'location_select_inside',   image: 'scene_door' }
        ]
    },

    // --- 商店 ---
    // 进入商店
    'store_options': {
        type: 'actionSelection',
        background: 'scene_store_front', 
        sfx: 'sfx_storeBell',
        dialogue: [{ speaker: 'Staff', line: 'Welcome in! Let me know if you need anything.' }],
        choices: [
            { text: 'Shop', target: 'store_buy_scene' },
            { text: 'Rob', target: 'store_robbery_scene', action: 'unlockAchievement:brute_force' }, // 店员会掏出武器说“I'm sorry what did you just say?”
            { text: 'Leave', target: 'location_select_outside' } // 假设你有一个室外选择场景
        ]
    },
    // 购买界面
    'store_buy_scene': {
        type: 'shopScene',
        background: 'scene_store_counter', 
        target_on_close: 'store_options', // 点击关闭按钮后跳转回的节点

        // 根据犯罪等级决定播放电视哪个视频
        tvVideos: {
            0: 'tv_news_normal', // 犯罪等级0播放正常新闻
            1: 'tv_news_normal_rob',   // 犯罪等级1播放抢劫新闻
            2: 'tv_news_normal_school',   // 犯罪等级2播放学校被炸了的新闻
            3: 'tv_news_normal_rob_school', // 犯罪等级3播放抢劫+学校被炸了的新闻
            4: 'tv_news_savior', // 犯罪等级4播放救世主新闻
            5: 'tv_news_savior_rob', // 犯罪等级5播放抢劫+救世主新闻
            6: 'tv_news_savior_school', // 犯罪等级6播放学校被炸了+救世主新闻
            7: 'tv_news_savior_rob_school' // 犯罪等级7播放抢劫+学校被炸了+救世主新闻
        },

        // 商品列表
        itemsForSale: [
            { id: 'tnt', name: 'TNT', price: 100, image: 'item_tnt_image', stock: 3},
            { id: 'lovePotion', name: 'Love Potion', price: 20, image: 'item_potion_image', stock: 3},
            //{ id: 'blades', name: 'A box of blades', price: 1, image: 'item_blade_image', stock: 1},
            { id: 'gun', name: 'Gun', price: 50, image: 'item_gun_image', stock: 1},
            { id: 'garlic', name: 'Garlic', price: 5, image: 'item_garlic_image', stock: 5},
            { id: 'holyWater', name: 'Holy Water', price: 10, image: 'item_holyWater_image', stock: 5},
            { id: 'cross', name: 'Cross', price: 15, image: 'item_cross_image', stock: 2},
            { id: 'silverBullet', name: 'Silver Bullet', price: 25, image: 'item_silverBullet_image', stock: 2}
        ]
    },

    // 抢劫界面
    'store_robbery_scene': {
    type: 'actionSelection',
    background: 'scene_store_robbery',
    dialogue: [{speaker:'Staff', line:'Yes?'}],
    choices: [
        {text: 'Continue!', target: 'ending_challenge' }, // 指向一个结局
        {text: 'Back off', target: 'store_options' } // 返回商店选项
    ]
    },
    'ending_challenge': {
        type: 'ending',
        endingTitle: 'END X: Challenge Failed',
        endingImage: 'ending_dieUnderStaff',
        dialogue: 'I praise your bravery.',
    },

    // 特殊场景
    // FAQ 聊天场景
    'faq_scene': {
        type: 'chatScene',
        // 定义完整的对话树
        conversationTree: {
            // 对话的起始点
            'start': {
                authorLine: "Hi! How may I help you?",
                playerChoices: [
                    { text: "Where's my bloody red cactus lord?!", nextStage: 'player_asks_about_lord' }
                ]
            },
            // 玩家提问后
            'player_asks_about_lord': {
                playerLine: "Where's my bloody red cactus lord?!", // 玩家说的话会先显示
                authorLine: "What do you mean?",
                playerChoices: [
                    { text: "My cactus", nextStage: 'player_clarifies_cactus' },
                    { text: "The one that came alive?", nextStage: 'player_clarifies_cactus' }
                ]
            },
            // 玩家进一步澄清
            'player_clarifies_cactus': {
                playerLine: "My cactus, the one that came alive?",
                authorLine: {
                    type: 'conditional', // 声明这是一个条件性对话
                    lines: [
                        // 按顺序检查这里的条件
                        { condition: 'cactusAlive:true', text: "Dear player, our system has detected that your cactus is growing healthily." },
                        { condition: 'default', text: "Dear player, we understand that you may be a little bit upset with the fact that you drowned your cactus, sorry about that, but it's part of the game play experience" }
                    ]
                }, //这里是想让系统判定一下玩家当时的仙人掌是溺水状态还是健康地活着，从而影响authorLine
                playerChoices: [
                    { text: "You know what I'm talking about.", nextStage: 'player_push_further'}
                ]
            },
            'player_push_further': {
                playerLine: "Stop pretending. You know what I'm talking about.",
                authorLine: "You see... You only live once, right?",
                playerChoices: [
                    {text: "......", nextStage: 'player_silent'}
                ]
            },
            'player_silent' :{
                playerLine:"......",
                authorLine:"and so does everything else."
            },

            // --- 刀片相关的对话分支 ---
            // 'start_blades': {
            //     authorLine: "Got something for me?",
            //     playerChoices: [
            //         { text: "I bought you a box of blades.", nextStage: 'player_sends_blades' }
            //     ]
            // },
            // 'player_sends_blades': {
            //     playerLine: "I bought you a box of blades.",
            //     authorLine: ["...", "Thanks, I guess.", "(You unlocked a new achievement: Breaking the Fourth Wall)"],
            //     action: 'unlockAchievement:break_fourth_wall', // 在对话中解锁成就
            //     playerChoices: []
            // }
        }
    },
};

// --- 【核心修正】所有结局的总览，键名需要和上面的结局ID完全一样 ---
const allEndings = {
    'ending_eternal_sleep': {
        title: 'END 1: Eternal Sleep',
        description: 'You chose sleep over the world.'
    },
    'ending_didntGetUp': {
        title: "END 5: Didn't even try",
        description: 'You got up just to go back to bed.'
    },
    'ending_challenge': {
        title: 'END X: Challenge Failed',
        description: 'You just love to challange (died before the unbeatable store staff).'
    },
    'endingFoodPoisoning':{
        title: "END 6: Don't eat Stranger's Food",
        description: ".....Shit..!"
    },
    'endingSunset':{
        title: "END 4: A Beautiful Sunset",
        description: "Isn't it beautiful?"
    },
};

// 【新增】所有成就的总览
const allAchievements = {
    'fly': {
        title: 'Fly!',
        description: 'As you wish.'
    },
    'brute_force': {
        title: 'Brute Force',
        description: 'Attempted to rob the store staff.'
    },
    'seduction_success': {
        title: 'A Good Affair',
        description: 'Successfully lured an insectoid.'
    },
    'seduction_fail': {
        title: 'A Bad Affair',
        description: 'Failed to lure an insectoid.'
    },
    'worth_a_try': {
        title: 'Worth a Try',
        description: 'Tried to seduce the store staff.'
    },
    'Should_not': {
        title: 'You did not just do that... You should not...',
        description: 'Tried to lure the insectoid with a kid.'
    },
    // 'break_fourth_wall': {
    //     title: '砍破第四面墙 / Breaking the Fourth Wall',
    //     description: '给游戏作者寄了一盒刀片。'
    // }

};
