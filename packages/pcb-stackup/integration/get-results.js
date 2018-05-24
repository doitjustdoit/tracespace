// runs pcb-stackup on the board fixtures
'use strict'

const runParallel = require('run-parallel')
const runWaterfall = require('run-waterfall')

const debug = require('debug')('tracespace/pcb-stackup/integration')
const pcbStackup = require('..')

module.exports = function getResults (boards, done) {
  debug(`Rendering stackups for ${boards.length} suites`)

  const tasks = boards.map(board => next => renderSuite(board, next))

  runParallel(tasks, done)
}

function renderSuite (board, done) {
  debug(`Render started for ${board.name}`)

  const options = Object.assign({id: `__${board.name}`}, board.options)
  const layers = board.layers.map(layer => {
    const {filename} = layer

    return {
      filename: filename,
      gerber: layer.source,
      options: Object.assign({id: `__${filename}`}, layer.options)
    }
  })

  runWaterfall(
    [
      next => pcbStackup(layers, options, next),
      (stackup, next) => next(null, makeBoardResult(board, stackup))
    ],
    done
  )
}

function makeBoardResult (board, stackup) {
  return Object.assign(
    {
      specs: [
        {name: 'top', render: stackup.top.svg},
        {name: 'bottom', render: stackup.bottom.svg}
      ]
    },
    board
  )
}
