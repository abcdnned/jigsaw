import Phaser from 'phaser';

class JigsawPuzzle extends Phaser.Scene {
    constructor() {
        super('JigsawPuzzle');
    }

    init(data) {
        this.imageFile = data.imageFile;
        this.resolution = data.resolution;
        this.depth = 0;
    }

    preload() {
        // Load the user-provided image
        if (this.imageFile instanceof File) {
            this.load.image('originalPuzzle', URL.createObjectURL(this.imageFile));
        } else if (typeof this.imageFile === 'string') {
            this.load.image('originalPuzzle', this.imageFile);
        } else {
            console.error('Invalid image file format');
        }
    }

    create() {
        // Set up game variables
        this.puzzlePieces = [];
        
        // Create a green background for the puzzle area
        this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY, 500, 500, 0x90EE90)
            .setOrigin(0.5);
        
        // Add transparent grid
        this.addGrid();
        
        // Normalize the image to 500x500
        this.normalizeImage();
        
        // Create puzzle pieces
        this.createPuzzlePieces();
        
        // Shuffle pieces
        this.shufflePieces();
        
        // Set up drag and drop functionality
        this.input.on('pointerdown', this.startDrag, this);
        this.input.on('pointermove', this.doDrag, this);
        this.input.on('pointerup', this.stopDrag, this);
    }

    addGrid() {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xffffff, 1);  // White color with 30% opacity

        const cellSize = 500 / this.resolution;
        
        // Draw vertical lines
        for (let x = 0; x <= this.resolution; x++) {
            graphics.moveTo(this.cameras.main.centerX - 250 + x * cellSize, this.cameras.main.centerY - 250);
            graphics.lineTo(this.cameras.main.centerX - 250 + x * cellSize, this.cameras.main.centerY + 250);
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.resolution; y++) {
            graphics.moveTo(this.cameras.main.centerX - 250, this.cameras.main.centerY - 250 + y * cellSize);
            graphics.lineTo(this.cameras.main.centerX + 250, this.cameras.main.centerY - 250 + y * cellSize);
        }

        graphics.strokePath();
    }

    normalizeImage() {
        const originalImage = this.textures.get('originalPuzzle').getSourceImage();
        const canvas = this.textures.createCanvas('normalizedPuzzle', 500, 500);
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(originalImage, 0, 0, originalImage.width, originalImage.height, 0, 0, 500, 500);
        canvas.refresh();
    }

    createPuzzlePieces() {
        const pieceWidth = 500 / this.resolution;
        const pieceHeight = 500 / this.resolution;

        for (let y = 0; y < this.resolution; y++) {
            for (let x = 0; x < this.resolution; x++) {
                const texture = this.textures.createCanvas(`piece_${x}_${y}`, pieceWidth, pieceHeight);
                const context = texture.getContext();
                context.drawImage(this.textures.get('normalizedPuzzle').getSourceImage(), 
                    x * pieceWidth, y * pieceHeight, pieceWidth, pieceHeight,
                    0, 0, pieceWidth, pieceHeight);
                texture.refresh();

                const piece = this.add.image(0, 0, `piece_${x}_${y}`);
                piece.setDisplaySize(pieceWidth, pieceHeight);
                piece.setOrigin(0, 0);
                piece.setInteractive();
                piece.setDataEnabled();
                piece.data.set('correctX', x * pieceWidth);
                piece.data.set('correctY', y * pieceHeight);
                piece.setDepth(this.depth++);  // Set auto-incrementing depth
                this.puzzlePieces.push(piece);
            }
        }
    }

    shufflePieces() {
        Phaser.Utils.Array.Shuffle(this.puzzlePieces);
        const puzzleArea = new Phaser.Geom.Rectangle(
            this.cameras.main.centerX - 250,
            this.cameras.main.centerY - 250,
            500,
            500
        );

        this.puzzlePieces.forEach((piece) => {
            const x = Phaser.Math.Between(puzzleArea.left, puzzleArea.right - piece.displayWidth);
            const y = Phaser.Math.Between(puzzleArea.top, puzzleArea.bottom - piece.displayHeight);
            piece.setPosition(x, y);
        });
    }

    startDrag(pointer) {
        const x = pointer.x;
        const y = pointer.y;
        let topPiece = null;
        let maxDepth = -1;

        this.puzzlePieces.forEach(piece => {
            if (Phaser.Geom.Rectangle.Contains(piece.getBounds(), x, y)) {
                if (piece.depth > maxDepth) {
                    topPiece = piece;
                    maxDepth = piece.depth;
                }
            }
        });
        if (topPiece) {
            console.log('Top piece depth:', topPiece.depth);
        }

        if (topPiece) {
            this.draggedPiece = topPiece;
            this.draggedPiece.setTint(0x44ff44);
            this.draggedPiece.setDepth(this.depth++);
            
            // Calculate and store the offset
            this.dragOffset = {
                x: this.draggedPiece.x - pointer.x,
                y: this.draggedPiece.y - pointer.y
            };
        }
    }

    doDrag(pointer) {
        if (this.draggedPiece) {
            // Use the stored offset when updating the piece position
            this.draggedPiece.x = pointer.x + this.dragOffset.x;
            this.draggedPiece.y = pointer.y + this.dragOffset.y;
        }
    }

    stopDrag() {
        if (this.draggedPiece) {
            this.draggedPiece.clearTint();

            // Calculate the correct position for the piece
            const correctX = this.cameras.main.centerX - 250 + this.draggedPiece.data.get('correctX');
            const correctY = this.cameras.main.centerY - 250 + this.draggedPiece.data.get('correctY');

            // Calculate the distance between current and correct position
            const distanceX = Math.abs(this.draggedPiece.x - correctX);
            const distanceY = Math.abs(this.draggedPiece.y - correctY);

            // If the piece is close to its correct position, snap it into place
            const snapThreshold = 20; // Adjust this value to change the snapping distance
            if (distanceX < snapThreshold && distanceY < snapThreshold) {
                this.draggedPiece.setPosition(correctX, correctY);
            }

            this.draggedPiece = null;
            this.checkWinCondition();
        }
    }

    checkWinCondition() {
        const allCorrect = this.puzzlePieces.every(piece => 
            Math.abs(piece.x - (this.cameras.main.centerX - 250 + piece.data.get('correctX'))) < 10 &&
            Math.abs(piece.y - (this.cameras.main.centerY - 250 + piece.data.get('correctY'))) < 10
        );

        if (allCorrect) {
            this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'You Win!', 
                { fontSize: '32px', fill: '#fff' })
                .setOrigin(0.5)
                .setDepth(100);  // Set the depth to 100
        }
    }
}

export function initGame(imageFile, resolution) {
    const config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: 'game-container',
        scene: JigsawPuzzle,
        backgroundColor: '#f0f0f0', // Light gray background for the entire game area
    };

    const game = new Phaser.Game(config);
    game.scene.start('JigsawPuzzle', { imageFile, resolution });
}