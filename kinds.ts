// =====================================================================
//  EMBERFALL  -  a souls-like in MakeCode Arcade
//  Controls:  left/right move, up jump / climb, down climb / drink a Cordial / rest at bonfire
//             A tap = attack (sword: 3-hit combo), A hold = heavy / block / power shot
//             B roll (dodge)   MENU = equipment
//  The game runs one "tick" 30 times a second (game.onUpdateInterval at the bottom).
// =====================================================================
namespace SpriteKind {
    export const Boss = SpriteKind.create()
    export const Scenery = SpriteKind.create()
    export const FireWave = SpriteKind.create()
    export const EnemyArrow = SpriteKind.create()
    export const PlayerArrow = SpriteKind.create()
    export const PowerArrow = SpriteKind.create()
    export const Ember = SpriteKind.create()
    export const Smoulder = SpriteKind.create()
}
