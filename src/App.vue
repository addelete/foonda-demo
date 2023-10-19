<template>
  <div class="app">
    <div v-if="renderedDiffGame">
      <StepGame :diffGame="renderedDiffGame" :showDiff="showDiff" />
    </div>
    <div class="controls">
      <button class="btn" id="_ArrowUp" :style="{ transform: 'translateY(-2em)' }"
        @click="tryMove({ x: 0, y: -1 })">↑</button>
      <button class="btn" id="_ArrowDown" :style="{ transform: 'translateY(2em)' }"
        @click="tryMove({ x: 0, y: 1 })">↓</button>
      <button class="btn" id="_ArrowLeft" :style="{ transform: 'translateX(-2em)' }"
        @click="tryMove({ x: -1, y: 0 })">←</button>
      <button class="btn" id="_ArrowRight" :style="{ transform: 'translateX(2em)' }"
        @click="tryMove({ x: 1, y: 0 })">→</button>
    </div>
    <div class="form-group">
      <span>最小步数</span>
      <input :style="{ width: '40px' }" type="number" v-model="randomMinSteps" />
      <button @click="randomOne(10)">生成</button>
    </div>
    <div class="form-group">
      <button @click="copyGame">分享</button>
      <button @click="trySlove">解答</button>
    </div>
    <div class="form-group" v-if="diffGames.length > 1">
      <button @click="prevStep" :disabled="0 === currentStepIndex">上一步</button>
      <span v-if="renderedDiffGameDir">{{ renderedDiffGameDir }}</span>
      <span>{{ currentStepIndex }}/{{ diffGames.length - 1 }}</span>
      <button @click="nextStep" :disabled="diffGames.length - 1 === currentStepIndex">下一步</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import StepGame from './components/StepGame.vue'
import { DiffGame, Direction, Game, dirMove, directions, randomGame, sloveGame } from './utils/game';
import CacheUtils from './utils/cache';

const game = ref<Game>({
  cols: 6,
  rows: 6,
  pieces: []
});

const solution = ref<number[] | undefined>(undefined)
const randomMinSteps = ref(10)
const diffGames = ref<DiffGame[]>([{ from: game.value, to: game.value, direction: { x: 0, y: 0 }, pieceDiffs: [] }])
const showDiff = ref(true)
const currentStepIndex = ref(0);

const renderedDiffGame = computed(() => {
  return diffGames.value[currentStepIndex.value]
})

const renderedDiffGameDir = computed(() => {
  const direction = renderedDiffGame.value.direction
  const index = directions.findIndex(item => direction.x === item.x && direction.y === item.y)
  return ['↓', '↑', '→', '←'][index] || ''
})

const prevStep = () => {
  showDiff.value = false
  currentStepIndex.value = Math.max(0, currentStepIndex.value - 1)
}

const nextStep = () => {
  showDiff.value = true
  currentStepIndex.value = Math.min(currentStepIndex.value + 1, diffGames.value.length - 1)
}

const trySlove = () => {
  solution.value = [];
  currentStepIndex.value = 0;
  diffGames.value = [{ from: game.value, to: game.value, direction: { x: 0, y: 0 }, pieceDiffs: [] }];
  solution.value = sloveGame(game.value);
  if (solution.value) {
    let currentPieces = game.value.pieces;
    solution.value.forEach(item => {
      const direction = directions[item]
      const { nextPieces, pieceDiffs } = dirMove({
        cols: game.value.cols,
        rows: game.value.rows,
        pieces: currentPieces,
      }, direction)
      diffGames.value.push({
        from: {
          ...game.value,
          pieces: [...currentPieces],
        },
        to: {
          ...game.value,
          pieces: [...nextPieces],
        },
        direction,
        pieceDiffs,
      })
      currentPieces = [...nextPieces]
    })

    console.log("求解完毕");
  } else {
    console.log("无解");
  }
}

const randomOne = (minSteps: number = 12) => {
  while (true) {
    const rGame = randomGame()
    const res = sloveGame(rGame)
    if (res && res.length > minSteps) {
      game.value = rGame
      diffGames.value = [{ from: game.value, to: game.value, direction: { x: 0, y: 0 }, pieceDiffs: [] }];
      solution.value = res
      currentStepIndex.value = 0;
      let currentPieces = game.value.pieces;
      solution.value.forEach(item => {
        const direction = directions[item]
        const { nextPieces, pieceDiffs } = dirMove({
          cols: game.value.cols,
          rows: game.value.rows,
          pieces: currentPieces,
        }, direction)
        diffGames.value.push({
          from: {
            ...game.value,
            pieces: [...currentPieces],
          },
          to: {
            ...game.value,
            pieces: [...nextPieces],
          },
          direction,
          pieceDiffs,
        })
        currentPieces = [...nextPieces]
      })
      break
    }
  }
}

const tryMove = (direction: Direction) => {
  const currentGame = diffGames.value[currentStepIndex.value].to
  if (solution.value) {
    game.value = {
      cols: currentGame.cols,
      rows: currentGame.rows,
      pieces: currentGame.pieces,
    }
    solution.value = undefined;
    currentStepIndex.value = 0;
    diffGames.value = [{ from: game.value, to: game.value, direction: { x: 0, y: 0 }, pieceDiffs: [] }];
  }

  const { isDiff, isWin, nextPieces, pieceDiffs } = dirMove(currentGame, direction);

  if (isDiff) {
    diffGames.value.push({
      from: currentGame,
      to: {
        ...game.value,
        pieces: nextPieces,
      },
      direction,
      pieceDiffs
    });
    showDiff.value = true;
    currentStepIndex.value++
    if (isWin) {
      setTimeout(() => {
        console.log("成功")
      }, 100)
    }
  }
}

const copyGame = () => {
  const gameKey = `${game.value.cols}${game.value.rows}${game.value.pieces.map(item => `${item.type}${item.status}${item.x}${item.y}`).join('')}`
  const urlData = new URL(location.href)
  urlData.searchParams.set("gameKey", gameKey)
  navigator.clipboard.writeText(urlData.toString())
  alert("游戏链接已复制")
}

const getGameByKey = (gameKey: string): Game => {
  const pieces = []
  for (let i = 2; i < gameKey.length; i = i + 4) {
    pieces
      .push({
        type: parseInt(gameKey[i]),
        status: parseInt(gameKey[i + 1]),
        x: parseInt(gameKey[i + 2]),
        y: parseInt(gameKey[i + 3]),
      })
  }
  return {
    cols: parseInt(gameKey[0]),
    rows: parseInt(gameKey[1]),
    pieces,
  }

}

watch(() => randomMinSteps.value, () => {
  CacheUtils.setItem("randomMinSteps", randomMinSteps.value)
})

watch(() => game.value, () => {
  CacheUtils.setItem("game", game.value)
})



onMounted(() => {
  let cacheGame = CacheUtils.getItem<Game>("game")
  const gameKey = new URL(location.href).searchParams.get("gameKey")
  if (gameKey) {
    cacheGame = getGameByKey(gameKey)
    CacheUtils.setItem("game", cacheGame)
    location.href = location.href.replace(/gameKey=[^&]+/, '')
  }
  if (cacheGame) {
    game.value = cacheGame
    diffGames.value = [{ from: game.value, to: game.value, direction: { x: 0, y: 0 }, pieceDiffs: [] }];
    currentStepIndex.value = 0;
  } else {
    randomOne()
  }
  document.addEventListener("keydown", (e) => {
    if (e.key.startsWith('Arrow')) {
      console.log(e.key)
      document.getElementById("_" + e.key)?.click()
    }
  })
})

</script>

<style lang="scss">
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding-top: 40px;

  .controls {
    height: 100px;
    width: 100px;
    position: relative;
    border-radius: 50%;
    margin-bottom: 30px;

    .btn {
      $btnSize: 40px;
      width: $btnSize;
      height: $btnSize;
      position: absolute;
      left: calc(50% - $btnSize * 0.5);
      top: calc(50% - $btnSize * 0.5);
      border-radius: $btnSize * 0.5;
      display: block;
      font-size: 18px;
    }
  }

  .form-group {
    display: flex;
    gap: 12px;
  }
}
</style>