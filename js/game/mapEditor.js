import '../../css/mapEditor.css';
import { Scene } from 'phaser';
import { button, div, input, option, p, select } from "../libs/html";
import { Tile } from './objects/tile';
import { key } from "firebase-key";
import { GameManager } from '../managers/gameManager';

export class MapEditor extends Scene {
    constructor() {
        super("MapEditor");
        this.tileSize = 80;
        this.data = null;
        this.map = null;
        this.tiles = [];
        this.gameObjects = [];
        this.url = 'https://mindlyracergame-default-rtdb.firebaseio.com/data';
        this.container = null;
        this.currentSelectedObject = null;
    }

    preload() {
        this.load.image('mapEditorShip', 'assets/images/ships/ship1.png');

        this.load.image('ringPlanet', 'assets/images/ringPlanet.png');

        this.load.image('blueAsteroid', 'assets/images/blueAsteroid.png');
        this.load.image('greenPlanet', 'assets/images/greenPlanet.png');
        this.load.image('largeAsteroid', 'assets/images/largeAsteroid.png');
        this.load.image('mediumAsteroid', 'assets/images/mediumAsteroid.png');
        this.load.image('orangePlanet', 'assets/images/orangePlanet.png');
        this.load.image('ringPlanet', 'assets/images/ringPlanet.png');
        this.load.image('finishLine', 'assets/images/finishLine.png');
        // this.load.image('asteroidL1', 'assets/images/asteroidL1.png');
        // this.load.image('asteroidM1', 'assets/images/asteroidM1.png');
        // this.load.image('asteroidS1', 'assets/images/asteroidS1.png');

        // this.load.image('ship2', 'assets/images/ships/ship2.png');
        // this.load.image('ship3', 'assets/images/ships/ship3.png');

        if (this.container === null) {
            this.container = div({ 'className': 'mapEditor_container' }, document.body);
            p({ 'innerHTML': 'Rows' }, this.container);
            this.rows = input({ 'type': 'number', 'value': 8, 'disabled': false }, this.container);

            p({ 'innerHTML': 'Cols' }, this.container);
            this.cols = input({ 'type': 'number', 'value': 8 }, this.container);

            p({ 'innerHTML': 'Name' }, this.container);
            this.nameInput = input({}, this.container);

            this.generateBtn = button({ 'innerHTML': 'GENERATE', 'onclick': this.generate.bind(this) }, this.container);

            this.mapsSlt = select({}, this.container);

            button({ 'innerHTML': 'LOAD', 'onclick': this.loadMap.bind(this) }, this.container);
            button({ 'innerHTML': 'SAVE', 'onclick': this.save.bind(this) }, this.container);
            this.cleanBtn = button({ 'innerHTML': 'CLEAN', 'onclick': this.clean.bind(this) }, this.container);

            var rowContainer = div({ 'className': 'mapEditor_row' }, this.container);
            this.addColsInput = input({ 'placeholder': 'COLS', 'type': 'number' }, rowContainer);
            this.addColsBtn = button({ 'innerHTML': 'ADD', 'onclick': this.addColumns.bind(this) }, rowContainer);

            button({ 'innerHTML': 'CLOSE', 'onclick': this.close.bind(this) }, this.container);

            this.isShiftDown = false;
            this.isSpaceDown = false;
            this.downloadMaps();

            this.spaceObjectsSlt = select({}, this.container);
            option({ 'innerHTML': 'blueAsteroid', 'value': 'blueAsteroid' }, this.spaceObjectsSlt);
            option({ 'innerHTML': 'greenPlanet', 'value': 'greenPlanet' }, this.spaceObjectsSlt);
            option({ 'innerHTML': 'largeAsteroid', 'value': 'largeAsteroid' }, this.spaceObjectsSlt);
            option({ 'innerHTML': 'mediumAsteroid', 'value': 'mediumAsteroid' }, this.spaceObjectsSlt);
            option({ 'innerHTML': 'orangePlanet', 'value': 'orangePlanet' }, this.spaceObjectsSlt);
            option({ 'innerHTML': 'ringPlanet', 'value': 'ringPlanet' }, this.spaceObjectsSlt);
            option({ 'innerHTML': 'finishLine', 'value': 'finishLine' }, this.spaceObjectsSlt);
            // option({ 'innerHTML': 'asteroidL1', 'value': 'asteroidL1' }, this.spaceObjectsSlt);
            // option({ 'innerHTML': 'asteroidM1', 'value': 'asteroidM1' }, this.spaceObjectsSlt);
            // option({ 'innerHTML': 'asteroidS1', 'value': 'asteroidS1' }, this.spaceObjectsSlt);
            button({ 'innerHTML': 'ADD OBJECT', 'onclick': this.addSpaceObject.bind(this) }, this.container);
            button({ 'innerHTML': 'DELETE SELECTED OBJECT', 'onclick': this.removeSelectecObject.bind(this) }, this.container);
            button({ 'innerHTML': 'DELETE OBJECT ALL', 'onclick': this.removeAllObjects.bind(this) }, this.container);
        } else {
            this.container.classList.remove('hide');
        }
    }

    create() {

        // GameManager.instance.disableGameUIEvents();

        this.container.style.left = this.renderer.width + 'px';
        this.worldHeight = this.renderer.height;
        this.ship = this.add.sprite(40, 40, 'mapEditorShip');
        this.ship.setDepth(2);
        // this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.startFollow(this.ship, false, 0.2, 0.2);
        this.cursors = this.input.keyboard.createCursorKeys();

        this.textures.generate('tile', { data: ['2'], pixelWidth: this.tileSize });
        // this.image = this.add.image(300, 200, 'tile').setOrigin(0, 0);
        // this.image.setInteractive();
        // this.image.setDepth(1);
        // this.image.on('pointerdown', this.clickOnTile.bind(this));
        // var tile = new Tile(this, { x: 3, y: 5, size: 80 });


        this.input.on('dragstart', function (pointer, gameObject, dragX, dragY) {
            gameObject.setTint(0xff0000);
        });

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
            gameObject.x = dragX;
            gameObject.y = dragY;

        });

        this.input.on('dragend', function (pointer, gameObject) {
            this.scene.currentSelectedObject = gameObject;
            gameObject.clearTint();

        });

    }

    update() {

        if (this.cursors.shift.isDown) {
            this.isShiftDown = true;
        } else {
            this.isShiftDown = false;
        }

        if (this.cursors.space.isDown) {
            this.isSpaceDown = true;
        } else {
            this.isSpaceDown = false;
        }

        if (this.cursors.left.isDown) {
            this.ship.x -= 10;
        } else if (this.cursors.right.isDown) {
            this.ship.x += 10;
        }

        if (this.cursors.up.isDown) {
            this.ship.y -= 10;
        } else if (this.cursors.down.isDown) {
            this.ship.y += 10;
        }
    }

    render() {

    }

    generate() {

        if (this.nameInput.value !== '') {
            this.generateBtn.disabled = true;

            var rows = Number(this.rows.value);
            var cols = Number(this.cols.value);
            this.map = { name: this.nameInput.value, key: key(), grid: [], gameObjects: [] };

            option({ 'innerHTML': this.map.name, 'value': this.map.key }, this.mapsSlt);

            if (rows !== 0 && cols !== 0) {
                for (let i = 0; i < rows; i++) {
                    this.map.grid.push([]);
                    for (let j = 0; j < cols; j++) {
                        this.map.grid[i].push(0);
                        // new Tile(this, { x: i, y: j, size: 10 });
                    }
                }

                this.createVisualGrid();
            }

            console.log(this.grid);
        }
    }

    createVisualGrid() {
        this.generateBtn.disabled = true;
        var xpos = 0
        var x = xpos;
        var y = 0;

        for (let i = 0; i < this.map.grid.length; i++) {
            const row = this.map.grid[i];
            for (let j = 0; j < row.length; j++) {
                const tile = row[j];
                new Tile(this, { x: j, y: i, xpos: x, ypos: y, size: this.tileSize, value: tile }, this.onTileClick.bind(this));
                x += this.tileSize;
            }

            x = xpos;
            y += this.tileSize;
        }

        //Adds Game objects to scene
        if (this.map.gameObjects) {
            this.map.gameObjects.forEach(sprite => {
                var image = this.add.sprite(100, 100, sprite.name);
                image.x = sprite.x;
                image.y = sprite.y;
                image.id = sprite.id;
                image.setInteractive();
                this.input.setDraggable(image, true);
                this.gameObjects.push(image);
            });
        }
    }

    onTileClick(tile) {
        if (this.isShiftDown) {
            this.map.grid[tile.data.y][tile.data.x] = 1;
            tile.data.value = 1;
        } else if (this.isSpaceDown) {
            this.map.grid[tile.data.y][tile.data.x] = 2
            tile.data.value = 2;
        } else {
            this.map.grid[tile.data.y][tile.data.x] = 0;
            tile.data.value = 0;
        }

        tile.updateColor();
    }

    clean() {
        this.map = null;
        this.generateBtn.disabled = false;
        this.children.removeAll();
    }

    save() {
        if (this.map !== null) {
            if (this.nameInput.value !== '') {

                this.map.gameObjects = [];
                //Add gameObjects to map
                this.gameObjects.forEach(sprite => {
                    var go = { name: sprite.texture.key, x: sprite.x, y: sprite.y, id: sprite.id };
                    this.map.gameObjects.push(go);
                });

                let data = JSON.stringify(this.map);
                // console.log(data);

                let request = new XMLHttpRequest();
                request.open('PATCH', this.url + '/' + this.map.key + '/.json');
                request.onreadystatechange = (e) => {
                    // console.log(e);
                    if (e.target.readyState === 4) {
                        // var data = e.target.responseText;
                        // this.data = JSON.parse(data);
                        // console.log(this.data);
                    }
                }
                request.send(data)

            }
        }
    }

    downloadMaps() {
        let request = new XMLHttpRequest();
        request.open('GET', this.url + '.json');
        request.onreadystatechange = (e) => {
            if (e.target.readyState === 4) {
                var data = e.target.responseText;
                this.data = JSON.parse(data);
                for (const key in this.data) {
                    const map = this.data[key];
                    console.log(key);
                    option({ 'innerHTML': map.name, 'value': key }, this.mapsSlt);
                }
            }
        }
        request.send();
    }

    loadMap() {
        // console.log(key());
        if (this.data !== null) {
            // console.log(this.data[this.mapsSlt.value]);
            this.clean();
            this.nameInput.value = this.data[this.mapsSlt.value].name;
            this.map = this.data[this.mapsSlt.value];
            this.createVisualGrid();
        }
    }

    addColumns() {
        if (this.map !== null) {
            if (this.addColsInput.value !== '') {
                let cols = Number(this.addColsInput.value);
                this.map.grid.forEach(row => {
                    for (let i = 0; i < cols; i++) {
                        row.push(0)
                    }
                });

                this.children.removeAll();
                this.createVisualGrid();
            }

        }
    }

    close() {
        this.clean()
        this.container.classList.add('hide');
        this.scene.start("MenuScene");
    }

    addSpaceObject() {
        var image = this.add.sprite(100, 100, this.spaceObjectsSlt.value);
        image.setInteractive();
        image.x = this.ship.x;
        image.id = key();
        this.input.setDraggable(image, true);
        this.gameObjects.push(image);
        console.log(image);
    }

    removeSelectecObject() {
        if (this.gameObjects.length > 0) {
            for (let i = 0; i < this.gameObjects.length; i++) {
                const sprite = this.gameObjects[i];
                if (sprite.id === this.currentSelectedObject.id) {
                    this.gameObjects.splice(i, 1);
                    this.currentSelectedObject.destroy();
                    this.currentSelectedObject = null;
                    return;
                }
            }
        }
    }

    removeAllObjects() {

        if (this.gameObjects.length > 0) {
            this.gameObjects.forEach(sprite => {
                sprite.destroy();
            });
        }

        this.gameObjects = [];
    }
}