# ---------------------------------------------------------------- version
# shown on the title screen; bump it with every update
VERSION = "v0.7.1"
# ---------------------------------------------------------------- the main loop

def on_update_interval():
    global anim_t, dead_t, banner_t
    if game_state == "title":
        pressText.set_flag(SpriteFlag.INVISIBLE, Math.idiv(anim_t, 15) % 2 == 1)
        anim_t += 1
    elif game_state == "play":
        take_damage()
        if game_state == "play":
            read_input()
            do_action()
            physics()
            m = 0
            while m <= len(e_type) - 1:
                if e_area[m] == area and e_alive[m] == 1:
                    enemy_think(m)
                m += 1
            update_boss()
            update_projectiles()
            update_embers()
        animate_knight()
    elif game_state == "cutscene":
        animate_knight()
    elif game_state == "dead":
        dead_t += 1
        if dead_t == 20:
            show_banner(bn_died, 90)
        if dead_t > 120:
            respawn()
        animate_knight()
    if game_state != "title":
        update_scenery()
    update_music()
    update_embered()
    draw_hud()
    if banner_t > 0:
        banner_t += -1
        if banner_t == 0:
            banner.set_flag(SpriteFlag.INVISIBLE, True)
game.on_update_interval(33, on_update_interval)

# ---------------------------------------------------------------- on start
scene.set_background_image(bg_title)
bonfire = sprites.create(fire_imgs[0], SpriteKind.scenery)
bonfire.set_flag(SpriteFlag.INVISIBLE, True)
restPrompt = sprites.create(txt_rest, SpriteKind.scenery)
restPrompt.set_position(22, 66)
restPrompt.set_flag(SpriteFlag.INVISIBLE, True)
stain = sprites.create(stain_img, SpriteKind.scenery)
stain.set_flag(SpriteFlag.INVISIBLE, True)
fog = sprites.create(fog_imgs[0], SpriteKind.scenery)
fog.set_flag(SpriteFlag.INVISIBLE, True)
fog.z = 20
keyItem = sprites.create(key_img, SpriteKind.scenery)
keyItem.set_position(150, GROUND - 6)
keyItem.set_flag(SpriteFlag.INVISIBLE, True)
door = sprites.create(door_closed_img, SpriteKind.scenery)
door.x = 151
door.bottom = GROUND
door.set_flag(SpriteFlag.INVISIBLE, True)
lockedPrompt = sprites.create(txt_locked, SpriteKind.scenery)
lockedPrompt.set_position(140, 68)
lockedPrompt.z = 50
lockedPrompt.set_flag(SpriteFlag.INVISIBLE, True)
shieldItem = sprites.create(shield_pickup_img, SpriteKind.scenery)
shieldItem.set_flag(SpriteFlag.INVISIBLE, True)
bowItem = sprites.create(bow_pickup_img, SpriteKind.scenery)
bowItem.set_flag(SpriteFlag.INVISIBLE, True)
n = 0
while n <= len(e_type) - 1:
    en = sprites.create(s_idle, SpriteKind.enemy)
    en.set_flag(SpriteFlag.INVISIBLE, True)
    en.z = 5
    e_sprites.append(en)
    # each knife thrower's knife (unused by everyone else)
    kn = sprites.create(knife_imgs[0], SpriteKind.scenery)
    kn.set_flag(SpriteFlag.INVISIBLE, True)
    kn.z = 6
    e_knife_spr.append(kn)
    n += 1
katanaItem = sprites.create(katana_img, SpriteKind.scenery)
katanaItem.x = KATANA_X
katanaItem.bottom = GROUND - 10
katanaItem.set_flag(SpriteFlag.INVISIBLE, True)
boss = sprites.create(b_idle[0], SpriteKind.boss)
boss.set_flag(SpriteFlag.INVISIBLE, True)
boss.z = 6
aura = sprites.create(aura_imgs[0], SpriteKind.scenery)
aura.set_flag(SpriteFlag.INVISIBLE, True)
aura.z = 11
knight = sprites.create(k_idle1[0], SpriteKind.player)
knight.set_flag(SpriteFlag.INVISIBLE, True)
knight.z = 10
hud = sprites.create(image.create(104, 24), SpriteKind.scenery)
hud.set_position(53, 13)
hud.z = 100
weaponIcon = sprites.create(icons[0], SpriteKind.scenery)
weaponIcon.set_position(40, 19)
weaponIcon.z = 100
keyIcon = sprites.create(key_img, SpriteKind.scenery)
keyIcon.set_position(68, 19)
keyIcon.z = 100
keyIcon.set_flag(SpriteFlag.INVISIBLE, True)
amuletIcon = sprites.create(icons[4], SpriteKind.scenery)
amuletIcon.set_position(54, 19)
amuletIcon.z = 100
amuletIcon.set_flag(SpriteFlag.INVISIBLE, True)
farsightItem = sprites.create(farsight_img, SpriteKind.scenery)
farsightItem.set_flag(SpriteFlag.INVISIBLE, True)
friend = sprites.create(friend_lean_img, SpriteKind.scenery)
friend.z = 4
friend.set_flag(SpriteFlag.INVISIBLE, True)
merchant = sprites.create(faced(merchant_img, -1), SpriteKind.scenery)
merchant.x = 124
merchant.bottom = GROUND - 14
merchant.z = 4
merchant.set_flag(SpriteFlag.INVISIBLE, True)
bossBar = sprites.create(image.create(104, 5), SpriteKind.scenery)
bossBar.set_position(80, 114)
bossBar.z = 100
bossBar.set_flag(SpriteFlag.INVISIBLE, True)
bossName = sprites.create(txt_boss_name, SpriteKind.scenery)
bossName.set_position(80, 106)
bossName.z = 100
bossName.set_flag(SpriteFlag.INVISIBLE, True)
banner = sprites.create(bn_gate, SpriteKind.scenery)
banner.z = 200
banner.set_flag(SpriteFlag.INVISIBLE, True)
titleText = sprites.create(txt_title, SpriteKind.scenery)
titleText.set_position(80, 22)
subText = sprites.create(txt_sub, SpriteKind.scenery)
subText.set_position(80, 38)
pressText = sprites.create(txt_press, SpriteKind.scenery)
pressText.set_position(80, 104)
controlsText = sprites.create(image.create(160, 8), SpriteKind.scenery)
controlsText.image.print_center("B: controls", 0, 11)
controlsText.set_position(80, 115)
versionText = sprites.create(image.create(40, 8), SpriteKind.scenery)
versionText.image.print(VERSION, 0, 0, 11)
versionText.left = 2
versionText.bottom = 119
titleMenu = sprites.create(image.create(160, 20), SpriteKind.scenery)
titleMenu.set_position(80, 100)
introText = sprites.create(image.create(160, 24), SpriteKind.scenery)
introText.set_position(80, 56)
introText.z = 300
keyRingItem = sprites.create(key_ring_img, SpriteKind.scenery)
keyRingItem.set_flag(SpriteFlag.INVISIBLE, True)
prisonGate = sprites.create(gate_closed_img, SpriteKind.scenery)
prisonGate.x = 150
prisonGate.bottom = GROUND
prisonGate.set_flag(SpriteFlag.INVISIBLE, True)
flags: List[Sprite] = []
for fx2 in [34, 92, 146]:
    flg = sprites.create(flag_imgs[0], SpriteKind.scenery)
    flg.x = fx2
    flg.bottom = GROUND
    flg.set_flag(SpriteFlag.INVISIBLE, True)
    flags.append(flg)
stocksSprite = sprites.create(stocks_closed_img, SpriteKind.scenery)
stocksSprite.x = 112
stocksSprite.bottom = GROUND
stocksSprite.set_flag(SpriteFlag.INVISIBLE, True)
glargon = sprites.create(image.create(1, 1), SpriteKind.scenery)
glargon.set_flag(SpriteFlag.INVISIBLE, True)
note = sprites.create(note_img, SpriteKind.scenery)
note.x = 66
note.bottom = GROUND
note.set_flag(SpriteFlag.INVISIBLE, True)
talkPrompt = sprites.create(txt_talk, SpriteKind.scenery)
talkPrompt.z = 150
talkPrompt.set_flag(SpriteFlag.INVISIBLE, True)
dialogue = sprites.create(image.create(156, 50), SpriteKind.scenery)
dialogue.set_position(80, 52)
dialogue.z = 260
dialogue.set_flag(SpriteFlag.INVISIBLE, True)
overlay = sprites.create(image.create(160, 120), SpriteKind.scenery)
overlay.set_position(80, 60)
overlay.z = 280
overlay.set_flag(SpriteFlag.INVISIBLE, True)
cellKey = sprites.create(key_img, SpriteKind.scenery)
cellKey.set_position(80, 100)
cellKey.set_flag(SpriteFlag.INVISIBLE, True)
cellDoor = sprites.create(cell_door_closed_img, SpriteKind.scenery)
cellDoor.x = 150
cellDoor.bottom = GROUND
cellDoor.set_flag(SpriteFlag.INVISIBLE, True)
# title screen: Continue / New Game (if there's a save), B for the controls
titleSel = 0
saved = has_save()
if saved:
    pressText.set_flag(SpriteFlag.INVISIBLE, True)
def drawTitleMenu():
    tm = titleMenu.image
    tm.fill(0)
    if saved:
        if titleSel == 0:
            tm.print_center("> Continue <", 0, 5)
            tm.print_center("New Game", 10, 11)
        else:
            tm.print_center("Continue", 0, 11)
            tm.print_center("> New Game <", 10, 5)
drawTitleMenu()
while not (controller.A.is_pressed()):
    if saved and (controller.up.is_pressed() or controller.down.is_pressed()):
        titleSel = 1 - titleSel
        drawTitleMenu()
        
        def on_pause_until():
            return not (controller.up.is_pressed()) and not (controller.down.is_pressed())
        pause_until(on_pause_until)
        
    if controller.B.is_pressed():
        game.show_long_text("CONTROLS\nLeft/Right: move\nUp: jump, climb\nDown: climb, flask\nDown at bonfire: rest\nB: roll (dodge)\nTap A: attack / combo\nHold A: heavy/block/aim\nA near someone: talk\nMENU: equipment",
            DialogLayout.FULL)
        
        def on_pause_until2():
            return not (controller.A.is_pressed()) and not (controller.B.is_pressed())
        pause_until(on_pause_until2)
        
    pause(20)

def on_pause_until3():
    return not (controller.A.is_pressed())
pause_until(on_pause_until3)

titleText.destroy()
subText.destroy()
pressText.destroy()
controlsText.destroy()
titleMenu.destroy()
versionText.destroy()
for fl3 in range(1, 5):
    fade_black.append(make_fade(fl3, 15))
    fade_white.append(make_fade(fl3, 1))
controller.menu.on_event(ControllerButtonEvent.PRESSED, open_menu)
if saved and titleSel == 0:
    load_game()
    respawn()
else:
    settings.write_number("ef_saved", 0)
    play_intro()
    
    def on_pause_until4():
        return not (controller.A.is_pressed())
    pause_until(on_pause_until4)
    
    info.set_score(0)
    start_new_game()