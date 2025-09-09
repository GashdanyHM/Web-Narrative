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
        sfx: 'sfx_loop'     // 循环背景音效 (假设已在 assets 中定义)
    },

    // --- 【游戏故事起点】 ---
    'start': {
        type: 'actionSelection',
        background: 'inbed_morning',
        dialogue: '[Alarm] Beep Beep Beep...',
        bgm: 'bgm_start', // 在此场景循环播放背景音乐
        choices: [
            { text: 'Get Up', target: 'getting_up_cg' },
            { text  : 'Snoozzzze...', target: 'snooze_midday' }
        ]
    },

    'getting_up_cg': { // 起床朦胧睡眼 CG
        type: 'cgScene',
        duration: 2000,     // 持续1.2秒
        image: 'cg_getUp',
        target: 'location_select_inside'
    },
    'snooze_midday': {
        type: 'actionSelection',
        background: 'inbed_noon', 
        dialogue: 'You drift back to sleep. The sun is higher in the sky now.',
        choices: [
            { text: 'Get Up', target: 'getting_up_cg' },
            { text: 'Snooze', target: 'snooze_night' }
        ]
    },
    'snooze_night': {
        type: 'actionSelection',
        background: 'inbed_night',
        dialogue: 'Darkness falls. The day is gone. Perhaps... forever?',
        choices: [
            { text: 'Get Up', target: 'getting_up_cg' },
            { text: 'Snooze', target: 'ending_eternal_sleep' }
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
        { name: 'Desk', target: 'desk_options', image: 'scene_desk' },
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

    'desk_options': {
        type: 'actionSelection',
        background: 'scene_desk',
        dialogue: 'Your desk is cluttered with papers and a computer.',
        choices: [
            { text: 'Work on computer', target: 'event_lord_cactus_dies' },  // for 测试！！！！！
            { text: 'Organize papers', target: null },
            { text: 'Back', target: 'location_select_inside' }
        ]
    },

    //室外
        'location_select_outside': {
        type: 'locationSelection',
        background: 'outsideOptions',
        locations: [
        { name: 'Street', target: 'street_scene', image: 'scene_street' },
        { name: 'School', target: 'school_scene', image: 'scene_school' },
        { name: 'Store', target: 'store_options', image: 'scene_store' },
        { name: 'Hiking', target: 'hiking_scene', image: 'scene_hike' }, 
        { name: 'Amusement Park', target: 'park_options', image: 'scene_amusement' },
        { name: 'Home', target: 'location_select_inside',   image: 'scene_door' }
        ]
    },

    // --- 商店 ---
    // 进入商店
    'store_options': {
        type: 'actionSelection',
        background: 'scene_store_front', // 商店的背景图
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
        background: 'scene_store_counter', // 柜台+店员
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
            { id: 'blades', name: 'A box of blades', price: 1, image: 'item_blade_image', stock: 1},
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
    background: 'scene_store_counter',
    dialogue: '你掏出了...空气。店员掏出了枪。',
    choices: [
        { text: '...', target: 'ending_challenge' }, // 指向一个结局
        {text: 'Back off', target: 'store_options' } // 返回商店选项
    ]
    },
    'ending_challenge': {
        type: 'ending',
        endingTitle: 'END X: Challenge Failed',
        endingImage: 'ending_challenge_failed',
        dialogue: '店员毫不犹豫地开枪了。你倒在地上，血流如注。也许下次你应该带把枪？',
    },



    // 特殊场景
    // 【新增】FAQ 聊天场景
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
                // 对话结束，没有更多选项
            },

            // --- 刀片相关的对话分支 ---
            'start_blades': {
                authorLine: "Got something for me?",
                playerChoices: [
                    { text: "I bought you a box of blades.", nextStage: 'player_sends_blades' }
                ]
            },
            'player_sends_blades': {
                playerLine: "I bought you a box of blades.",
                authorLine: ["...", "Thanks, I guess.", "(You unlocked a new achievement: Breaking the Fourth Wall)"],
                action: 'unlockAchievement:break_fourth_wall', // 在对话中解锁成就
                playerChoices: []
            }
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
    }
};

// 【新增】所有成就的总览
const allAchievements = {
    'fly': {
        title: '飞! / Fly!',
        description: '长出了翅膀。'
    },
    'brute_force': {
        title: '武力压制 / Brute Force',
        description: '尝试抢劫商店老板。'
    },
    'seduction_success': {
        title: '一段佳缘 / A Good Affair',
        description: '成功色诱了一名虫族。'
    },
    'seduction_fail': {
        title: '一段孽缘 / A Bad Affair',
        description: '在没有迷情剂的情况下色诱一名虫族并失败。'
    },
    'worth_a_try': {
        title: '值得一试 / Worth a Try',
        description: '尝试对商店老板使用迷情剂。'
    },
    'should_not': {
        title: '人不能，至少不应该 / You Shouldn\'t',
        description: '尝试色诱公园里的带着孩子的虫族。'
    },
    'break_fourth_wall': {
        title: '砍破第四面墙 / Breaking the Fourth Wall',
        description: '给游戏作者寄了一盒刀片。'
    }
};