class Card {
    constructor(color, type, value) {
        this.color = color; // red, blue, green, yellow, wild
        this.type = type; // operation, result, special
        this.value = value; // Pode ser operação (ex: "2+3") ou resultado (ex: 5)
    }

    canPlayOn(otherCard, chosenColor = null) {
        // Qualquer carta especial laranja pode ser jogada sobre qualquer carta
        if (this.color === 'orange' && this.type === 'special') return true;

        // Se a carta do topo é especial laranja, qualquer carta pode ser jogada
        // (regras específicas são tratadas fora: número ímpar via needOddNumber, coringa vira número)
        const drawSpecials = ['Compre pela Última Carta', 'Compre pela Operação'];
        if (otherCard.color === 'orange' && otherCard.type === 'special') {
            return true;
        }
        
        // Mesma cor
        if (this.color === otherCard.color) return true;
        
        // Impedir combinar cartas especiais não-laranja por valor
        if (this.type === 'special' || otherCard.type === 'special') {
            return false;
        }
        
        // Avaliar valores matemáticos
        const thisValue = this.getNumericValue();
        const otherValue = otherCard.getNumericValue();
        
        // Ambas têm o mesmo número
        if (thisValue !== null && otherValue !== null && thisValue === otherValue) {
            return true;
        }
        
        // Esta carta é resultado da operação da outra
        if (this.type === 'result' && otherCard.type === 'operation') {
            return this.value === otherValue;
        }
        
        // A outra carta é resultado da operação desta
        if (this.type === 'operation' && otherCard.type === 'result') {
            return thisValue === otherCard.value;
        }
        
        // Ambas são operações e têm o mesmo resultado
        if (this.type === 'operation' && otherCard.type === 'operation') {
            return thisValue === otherValue;
        }
        
        return false;
    }
    
    getNumericValue() {
        // Se for carta de resultado, retorna o número diretamente
        if (this.type === 'result') {
            return this.value;
        }
        
        // Se for operação, calcula o resultado
        if (this.type === 'operation') {
            return evaluateOperation(this.value);
        }
        
        // Cartas especiais não têm valor numérico
        return null;
    }

    getDisplayValue() {
        if (this.type === 'special') {
            return this.value;
        }
        return this.value;
    }
}

// Função para avaliar operações matemáticas
function evaluateOperation(operation) {
    try {
        // Substituir símbolos matemáticos
        let expr = operation.replace(/×/g, '*').replace(/÷/g, '/');
        // Avaliar a expressão
        return eval(expr);
    } catch (e) {
        return null;
    }
}

// Gerenciador do jogo
class MatematicardsGame {
    constructor() {
        this.deck = [];
        this.discardPile = [];
        this.players = [
            { name: 'Jogador 1', hand: [], isHuman: true },
            { name: 'Jogador 2 (CPU)', hand: [], isHuman: false }
        ];
        this.currentPlayerIndex = 0;
        this.direction = 1; // Mantém fluxo de turnos (sentido horário)
        this.gameOver = false;
        this.saidMatematicards = false;
        this.player1PreviousHandSize = 5; // Rastreia o tamanho da mão antes da última jogada
        this.player1SaidMatematica = false; // Rastreia se o jogador 1 apertou MATEMÁTICA
        
        this.initDeck();
        this.shuffleDeck();
        this.dealCards();
        this.startGame();
    }

    initDeck() {
        const colors = ['red', 'blue', 'green', 'yellow'];
        const operations = [
            '2+3', '3+4', '5+2', '1+6', '4+3',
            '8-3', '7-2', '9-4', '6-1', '10-3',
            '2×3', '3×2', '2×4', '3×3', '2×5',
            '8÷2', '6÷2', '10÷2', '9÷3', '12÷3'
        ];
        
        const results = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        // Criar cartas de operações (1 de cada cor)
        colors.forEach(color => {
            operations.forEach(op => {
                this.deck.push(new Card(color, 'operation', op));
            });
        });

        // Criar cartas de resultados (2 de cada cor)
        colors.forEach(color => {
            results.forEach(result => {
                for (let i = 0; i < 2; i++) {
                    this.deck.push(new Card(color, 'result', result));
                }
            });
        });

        // Criar cartas especiais laranjas (1 de cada)
        const specialCards = [
            'Alterar Operador',
            'Compre pela Última Carta',
            'Número Ímpar',
            'Descarte Expressões',
            'Trocar Expressões',
            'Coringa 0-9',
            'Compre pela Operação',
            'Compre pela Operação'
        ];
        
        specialCards.forEach(special => {
            this.deck.push(new Card('orange', 'special', special));
        });
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCards() {
        // Distribuir 5 cartas para cada jogador
        for (let i = 0; i < 5; i++) {
            this.players.forEach(player => {
                player.hand.push(this.deck.pop());
            });
        }

        // Primeira carta do monte de descarte (não pode ser especial)
        let firstCard;
        do {
            firstCard = this.deck.pop();
        } while (firstCard.type === 'special');
        
        this.discardPile.push(firstCard);
    }

    drawCard(player) {
        if (this.deck.length === 0) {
            // Embaralhar pilha de descarte se o deck acabar
            const topCard = this.discardPile.pop();
            this.deck = [...this.discardPile];
            this.discardPile = [topCard];
            this.shuffleDeck();
        }
        
        if (this.deck.length > 0) {
            player.hand.push(this.deck.pop());
            return true;
        }
        return false;
    }

    playCard(player, cardIndex) {
        const card = player.hand[cardIndex];
        const topCard = this.discardPile[this.discardPile.length - 1];

        if (!card.canPlayOn(topCard)) {
            return { success: false, message: 'Jogada inválida!' };
        }

        // Remover carta da mão
        player.hand.splice(cardIndex, 1);
        this.discardPile.push(card);

        // Verificar vitória
        if (player.hand.length === 0) {
            this.gameOver = true;
            return { success: true, winner: player.name };
        }

        // Processar cartas especiais
        return this.processSpecialCard(card);
    }

    processSpecialCard(card) {
        const result = { success: true };

        switch (card.value) {
            case 'Alterar Operador':
                result.needOperatorChange = true;
                result.message = 'Escolha um novo operador para a carta da mesa!';
                return result;

            case 'Compre pela Última Carta':
                // Encontrar última carta de resultado jogada
                for (let i = this.discardPile.length - 2; i >= 0; i--) {
                    if (this.discardPile[i].type === 'result') {
                        const drawCount = this.discardPile[i].value;
                        const nextPlayer = this.players[(this.currentPlayerIndex + 1) % this.players.length];
                        for (let j = 0; j < drawCount; j++) {
                            this.drawCard(nextPlayer);
                        }
                        result.message = `Próximo jogador compra ${drawCount} cartas!`;
                        break;
                    }
                }
                if (!result.message) {
                    result.message = 'Nenhuma carta de resultado anterior encontrada!';
                }
                break;

            case 'Número Ímpar':
                result.needOddNumber = true;
                result.message = 'Próxima carta deve ser ou resultar em número ímpar!';
                return result;

            case 'Descarte Expressões':
                const currentPlayer = this.getCurrentPlayer();
                currentPlayer.hand = currentPlayer.hand.filter(c => c.type !== 'operation');
                result.message = 'Todas as cartas de expressões foram descartadas!';
                break;

            case 'Trocar Expressões':
                result.needPlayerChoice = true;
                result.message = 'Escolha um jogador para trocar cartas de expressões!';
                return result;

            case 'Coringa 0-9':
                result.needNumberChoice = true;
                result.message = 'Escolha um número de 0 a 9!';
                return result;

            case 'Compre pela Operação':
                // Encontrar última operação jogada
                for (let i = this.discardPile.length - 2; i >= 0; i--) {
                    if (this.discardPile[i].type === 'operation') {
                        const drawCount = this.discardPile[i].getNumericValue();
                        const nextPlayer = this.players[(this.currentPlayerIndex + 1) % this.players.length];
                        for (let j = 0; j < drawCount; j++) {
                            this.drawCard(nextPlayer);
                        }
                        result.message = `Próximo jogador compra ${drawCount} cartas!`;
                        break;
                    }
                }
                if (!result.message) {
                    result.message = 'Nenhuma operação anterior encontrada!';
                }
                break;
        }

        return result;
    }

    nextTurn() {
        // Salva o tamanho da mão do jogador 1 antes de passar o turno
        if (this.currentPlayerIndex === 0) {
            this.player1PreviousHandSize = this.players[0].hand.length;
            this.player1SaidMatematica = this.saidMatematicards;
        }
        this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
        this.saidMatematicards = false;
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    getTopCard() {
        return this.discardPile[this.discardPile.length - 1];
    }

    startGame() {
        // Jogo iniciado
    }

    // IA simples para o computador
    cpuPlay() {
        const player = this.getCurrentPlayer();
        const topCard = this.getTopCard();
        
        // Tentar encontrar uma carta válida
        let playedCard = false;
        for (let i = 0; i < player.hand.length; i++) {
            const card = player.hand[i];
            if (card.canPlayOn(topCard)) {
                const result = this.playCard(player, i);
                
                if (result.needOperatorChange) {
                    // CPU escolhe operador aleatório e aplica na operação da mesa
                    const operators = ['+', '-', '×', '÷'];
                    const randomOp = operators[Math.floor(Math.random() * operators.length)];
                    applyOperatorChange(randomOp);
                }
                
                if (result.needNumberChoice) {
                    // CPU escolhe número aleatório
                    const randomNum = Math.floor(Math.random() * 10);
                    topCard.value = randomNum;
                    topCard.type = 'result';
                }
                
                if (result.needPlayerChoice) {
                    // CPU troca com o jogador humano
                    const targetPlayer = this.players[0];
                    const currentOperations = player.hand.filter(c => c.type === 'operation');
                    const targetOperations = targetPlayer.hand.filter(c => c.type === 'operation');
                    
                    player.hand = player.hand.filter(c => c.type !== 'operation');
                    targetPlayer.hand = targetPlayer.hand.filter(c => c.type !== 'operation');
                    
                    player.hand.push(...targetOperations);
                    targetPlayer.hand.push(...currentOperations);
                }
                
                playedCard = true;
                return result;
            }
        }

        // Se não pode jogar, comprar carta
        if (!playedCard) {
            this.drawCard(player);
            return { success: true, message: 'CPU comprou uma carta', cpuDrew: true };
        }
    }
}

// Interface do jogo
let game;
let waitingForOperatorChange = false;
let waitingForNumberChoice = false;
let waitingForPlayerChoice = false;
let needOddNumber = false;
let selectedOperator = null;

function initGame() {
    game = new MatematicardsGame();
    updateUI();
    showRulesModal();
    
    // Verificar se é turno do CPU
    if (!game.getCurrentPlayer().isHuman) {
        setTimeout(cpuTurn, 1000);
    }
}

function updateUI() {
    // Atualizar contadores de cartas
    document.getElementById('player1-cards').textContent = game.players[0].hand.length;
    document.getElementById('player2-cards').textContent = game.players[1].hand.length;
    document.getElementById('draw-count').textContent = game.deck.length;
    document.getElementById('current-player').textContent = game.getCurrentPlayer().name;

    // Atualizar carta atual
    const topCard = game.getTopCard();
    const currentCardEl = document.getElementById('current-card');
    currentCardEl.className = `card ${topCard.color}`;
    if (topCard.type === 'result') {
        currentCardEl.classList.add('result');
    }
    currentCardEl.querySelector('.card-content').textContent = topCard.getDisplayValue();

    // Atualizar mão do jogador
    const handEl = document.getElementById('player-hand');
    handEl.innerHTML = '';
    game.players[0].hand.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.color}`;
        if (card.type === 'result') {
            cardEl.classList.add('result');
        }
        cardEl.innerHTML = `<div class="card-content">${card.getDisplayValue()}</div>`;
        
        cardEl.onclick = () => playerPlayCard(index);
        handEl.appendChild(cardEl);
    });

    // Habilitar/desabilitar botão MATEMÁTICA
    const matematicaBtn = document.getElementById('matematica-btn');
    const player1 = game.players[0];
    const canPressMathematica = player1.hand.length === 2 && player1.hand.some(card => card.canPlayOn(game.getTopCard()));
    matematicaBtn.disabled = !canPressMathematica;
}

function playerPlayCard(cardIndex) {
    if (!game.getCurrentPlayer().isHuman || game.gameOver) {
        return;
    }

    // Bloqueia ações até escolher o operador quando necessário
    if (waitingForOperatorChange) {
        showMessage('Escolha o operador para continuar.', 'info');
        return;
    }

    // Avisar se não apertou MATEMÁTICA (mas permitir jogar - risco de acusação)
    const player1 = game.players[0];
    const canPressMathematica = player1.hand.length === 2 && player1.hand.some(card => card.canPlayOn(game.getTopCard()));
    if (canPressMathematica && !game.saidMatematicards) {
        showMessage('Atenção: Você não apertou MATEMÁTICA! Arrisca ser acusado.', 'info');
    }

    const card = game.players[0].hand[cardIndex];
    
    // Verificar se precisa jogar número ímpar
    if (needOddNumber) {
        const value = card.getNumericValue();
        if (value === null || value % 2 === 0) {
            showMessage('Você deve jogar uma carta ímpar! Compre 2 cartas.', 'error');
            game.drawCard(game.players[0]);
            game.drawCard(game.players[0]);
            needOddNumber = false;
            game.nextTurn();
            updateUI();
            
            if (!game.getCurrentPlayer().isHuman) {
                setTimeout(cpuTurn, 1000);
            }
            return;
        }
        needOddNumber = false;
    }

    const result = game.playCard(game.players[0], cardIndex);
    
    if (!result.success) {
        showMessage(result.message, 'error');
        return;
    }

    if (result.winner) {
        showWinner(result.winner);
        return;
    }

    if (result.needOperatorChange) {
        waitingForOperatorChange = true;
        showOperatorModal();
        if (result.message) showMessage(result.message, 'info');
        return;
    } else if (result.needNumberChoice) {
        waitingForNumberChoice = true;
        showNumberModal();
        if (result.message) showMessage(result.message, 'info');
    } else if (result.needPlayerChoice) {
        waitingForPlayerChoice = true;
        showPlayerModal();
        if (result.message) showMessage(result.message, 'info');
    } else if (result.needOddNumber) {
        needOddNumber = true;
        if (result.message) showMessage(result.message, 'info');
        game.nextTurn();
        updateUI();
        
        if (!game.getCurrentPlayer().isHuman) {
            setTimeout(cpuTurn, 1000);
        }
    } else {
        if (result.message) showMessage(result.message, 'info');
        game.nextTurn();
        updateUI();
        
        // Turno do CPU
        if (!game.getCurrentPlayer().isHuman) {
            setTimeout(cpuTurn, 1000);
        }
    }
}

function drawCardAction() {
    if (!game.getCurrentPlayer().isHuman || game.gameOver || waitingForOperatorChange) {
        return;
    }

    // Se precisa jogar número ímpar e está comprando
    if (needOddNumber) {
        game.drawCard(game.players[0]);
        game.drawCard(game.players[0]);
        showMessage('Você não jogou ímpar! Comprou 2 cartas.', 'info');
        needOddNumber = false;
    } else {
        game.drawCard(game.players[0]);
        showMessage('Você comprou uma carta', 'info');
    }
    
    game.nextTurn();
    updateUI();

    // Turno do CPU
    if (!game.getCurrentPlayer().isHuman) {
        setTimeout(cpuTurn, 1000);
    }
}

function cpuTurn() {
    if (game.gameOver) return;

    // CPU acusa se jogador 1 não apertou MATEMÁTICA quando tinha 2 cartas e jogou uma
    if (game.player1PreviousHandSize === 2 && !game.player1SaidMatematica && game.players[0].hand.length === 1) {
        game.drawCard(game.players[0]);
        game.drawCard(game.players[0]);
        showMessage('CPU acusou! Você não apertou MATEMÁTICA quando tinha 2 cartas e comprou 2 cartas.', 'error');
        updateUI();
        setTimeout(() => {
            game.nextTurn();
            updateUI();
        }, 2000);
        return;
    }

    // Se precisa jogar número ímpar
    if (needOddNumber) {
        const player = game.players[1];
        let foundOdd = false;
        
        for (let i = 0; i < player.hand.length; i++) {
            const card = player.hand[i];
            const value = card.getNumericValue();
            if (value !== null && value % 2 !== 0) {
                const result = game.playCard(player, i);
                foundOdd = true;
                needOddNumber = false;
                
                if (result.message) showMessage(result.message, 'info');
                updateUI();
                
                setTimeout(() => {
                    game.nextTurn();
                    updateUI();
                }, 1500);
                return;
            }
        }
        
        if (!foundOdd) {
            game.drawCard(player);
            game.drawCard(player);
            showMessage('CPU não tinha ímpar! Comprou 2 cartas.', 'info');
            needOddNumber = false;
            updateUI();
            
            setTimeout(() => {
                game.nextTurn();
                updateUI();
            }, 1500);
            return;
        }
    }

    const result = game.cpuPlay();
    
    if (result.winner) {
        showWinner(result.winner);
        return;
    }

    if (result.message && !result.cpuDrew) {
        showMessage(result.message, 'info');
    } else if (result.cpuDrew) {
        showMessage(result.message, 'info');
    }

    updateUI();
    
    // Próximo turno
    setTimeout(() => {
        if (result.needOddNumber) {
            needOddNumber = true;
        }
        
        game.nextTurn();
        updateUI();
        
        // Se ainda for turno do CPU
        if (!game.getCurrentPlayer().isHuman && !game.gameOver) {
            setTimeout(cpuTurn, 1000);
        }
    }, 1500);
}

function showOperatorModal() {
    const modal = document.getElementById('operator-modal');
    modal.classList.add('active');
    
    const operatorBtns = document.querySelectorAll('.operator-btn');
    operatorBtns.forEach(btn => {
        btn.onclick = () => chooseOperator(btn.dataset.operator);
    });
}

function showRulesModal() {
    const modal = document.getElementById('rules-modal');
    modal.classList.add('active');
}

function applyOperatorChange(operator) {
    // Altera o operador da última carta de operação na pilha e traz essa carta para o topo
    const pile = game.discardPile;
    let opIndex = -1;
    for (let i = pile.length - 1; i >= 0; i--) {
        if (pile[i].type === 'operation') {
            opIndex = i;
            break;
        }
    }

    if (opIndex === -1) {
        showMessage('Não há operação na mesa para alterar.', 'error');
        return;
    }

    const opCard = pile[opIndex];
    const match = opCard.value.toString().match(/^(\d+)([+\-×÷])(\d+)$/);
    if (!match) {
        showMessage('Expressão inválida para alterar.', 'error');
        return;
    }

    opCard.value = `${match[1]}${operator}${match[3]}`;

    // Move a carta alterada para o topo da pilha
    pile.splice(opIndex, 1);
    pile.push(opCard);
}

function chooseOperator(operator) {
    selectedOperator = operator;
    document.getElementById('operator-modal').classList.remove('active');
    applyOperatorChange(operator);
    waitingForOperatorChange = false;
    showMessage(`Operador alterado para ${operator}!`, 'success');
    game.nextTurn();
    updateUI();

    if (!game.getCurrentPlayer().isHuman) {
        setTimeout(cpuTurn, 1000);
    }
}

function showNumberModal() {
    const modal = document.getElementById('number-modal');
    modal.classList.add('active');
    
    const numberBtns = document.querySelectorAll('.number-btn');
    numberBtns.forEach(btn => {
        btn.onclick = () => chooseNumber(btn.dataset.number);
    });
}

function chooseNumber(number) {
    // Criar uma carta temporária com o número escolhido
    const topCard = game.getTopCard();
    topCard.value = parseInt(number);
    topCard.type = 'result';
    
    document.getElementById('number-modal').classList.remove('active');
    waitingForNumberChoice = false;
    
    showMessage(`Número ${number} escolhido!`, 'success');
    game.nextTurn();
    updateUI();

    if (!game.getCurrentPlayer().isHuman) {
        setTimeout(cpuTurn, 1000);
    }
}

function showPlayerModal() {
    const modal = document.getElementById('player-modal');
    modal.classList.add('active');
    
    const playerBtns = document.querySelectorAll('.player-choice-btn');
    playerBtns.forEach(btn => {
        btn.onclick = () => choosePlayer(parseInt(btn.dataset.player));
    });
}

function choosePlayer(playerIndex) {
    const currentPlayer = game.getCurrentPlayer();
    const targetPlayer = game.players[playerIndex];
    
    // Trocar cartas de expressão
    const currentOperations = currentPlayer.hand.filter(c => c.type === 'operation');
    const targetOperations = targetPlayer.hand.filter(c => c.type === 'operation');
    
    currentPlayer.hand = currentPlayer.hand.filter(c => c.type !== 'operation');
    targetPlayer.hand = targetPlayer.hand.filter(c => c.type !== 'operation');
    
    currentPlayer.hand.push(...targetOperations);
    targetPlayer.hand.push(...currentOperations);
    
    document.getElementById('player-modal').classList.remove('active');
    waitingForPlayerChoice = false;
    
    showMessage(`Cartas de expressão trocadas com ${targetPlayer.name}!`, 'success');
    game.nextTurn();
    updateUI();

    if (!game.getCurrentPlayer().isHuman) {
        setTimeout(cpuTurn, 1000);
    }
}

function showMessage(message, type) {
    const messageBox = document.getElementById('message-box');
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    
    setTimeout(() => {
        messageBox.textContent = '';
        messageBox.className = 'message-box';
    }, 3000);
}

function showWinner(winnerName) {
    const modal = document.getElementById('winner-modal');
    document.getElementById('winner-text').textContent = `${winnerName} venceu!`;
    modal.classList.add('active');
}

function sayMatematica() {
    const player1 = game.players[0];
    const canPressMathematica = player1.hand.length === 2 && player1.hand.some(card => card.canPlayOn(game.getTopCard()));
    if (canPressMathematica) {
        game.saidMatematicards = true;
        showMessage('MATEMÁTICA! Agora você pode descartar sua carta.', 'success');
    }
}

// Event Listeners
document.getElementById('draw-card-btn').onclick = drawCardAction;
document.getElementById('matematica-btn').onclick = sayMatematica;
document.getElementById('new-game-btn').onclick = () => location.reload();
document.getElementById('rules-btn').onclick = showRulesModal;
document.getElementById('close-rules-btn').onclick = () => {
    document.getElementById('rules-modal').classList.remove('active');
};

// Iniciar o jogo
initGame();
