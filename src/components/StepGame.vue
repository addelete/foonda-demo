<template>
  <div>
    <v-stage :config="stageConfig">
      <v-layer>
        <v-rect v-for="g in gridConfigs" :config="g" />
        <v-text v-for="t in textConfigs" :config="t" />
        <v-image v-for="p in pieceConfigs" :config="p" />
      </v-layer>
    </v-stage>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { DiffGame, Game, PieceType } from '../utils/game';
import loadPieces from '../utils/loadPieces';

const props = defineProps<{
  diffGame: DiffGame,
  showDiff: boolean,
}>()

const piecesSrcMap = ref<Map<string, HTMLImageElement>>()

const renderGame = ref<Game>(props.diffGame.from)

const gridSize = 40;

const stageConfig = computed(() => {
  return {
    width: props.diffGame.to.cols * gridSize,
    height: props.diffGame.to.rows * gridSize,
  }
})

const gridConfigs = computed(() => {
  const result = []
  for (let i = 0; i < props.diffGame.to.rows; i++) {
    for (let j = 0; j < props.diffGame.to.cols; j++) {
      result.push({
        x: j * gridSize + 1,
        y: i * gridSize + 1,
        width: gridSize - 2,
        height: gridSize - 2,
        fill: '#333',
      })
    }
  }
  return result
})

const textConfigs = computed(() => {
  const result = []
  for (let i = 0; i < props.diffGame.to.rows; i++) {
    for (let j = 0; j < props.diffGame.to.cols; j++) {
      result.push({
        x: j * gridSize + 1,
        y: i * gridSize + 1 - 6 + gridSize * 0.5,
        width: gridSize,
        text: `${j}, ${i}`,
        align: 'center',
        fill: '#666'
      })
    }
  }
  return result
})

const pieceConfigs = computed(() => {
  if (!piecesSrcMap.value) return []
  const result = renderGame.value.pieces.map(item => {
    const x = item.x * gridSize
    const y = item.y * gridSize
    return {
      x,
      y,
      image: piecesSrcMap.value?.get(`${item.type}${item.status}`),
      width: gridSize,
      height: gridSize,
      type: item.type,
    }
  })
  const topPieceType = [PieceType.Player, PieceType.Coin]
  return result.sort((a, b) => {
    if (topPieceType.includes(a.type) && !topPieceType.includes(b.type)) return 1
    if (topPieceType.includes(b.type) && !topPieceType.includes(a.type)) return -1
    return 0
  })
})

watch(() => props.diffGame, () => {
  if (props.showDiff) {
    renderGame.value = props.diffGame.from
    let i = 0;
    const timer = setInterval(() => {
      if (i < props.diffGame.pieceDiffs.length) {
        const { index, ...piece } = props.diffGame.pieceDiffs[i]
        renderGame.value.pieces[index] = piece
        i++
      } else {
        clearInterval(timer)
      }
    }, 50)
  } else {
    renderGame.value = props.diffGame.to
  }

})

onMounted(() => {
  loadPieces().then(res => {
    piecesSrcMap.value = res
  })
})

</script>

<style lang="scss"></style>