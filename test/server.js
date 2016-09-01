var assert  = require('chai').assert,
  expect = require('chai').expect,
  superagent = require('superagent'),
  expected, current

before(() => {
  expected = ['a', 'b', 'c']
})

describe('String#splict', () => {
  beforeEach(() => {
    current = 'a,b,c'.split(',')
  })

  it('should return an array', () => {
    expect(Array.isArray(current)).to.be.true
  })

  it('should return the same array', () => {
    expect(expected.length).to.equal(current.length)
    for (var i = 0; i < expected.length; i++) {
      expect(expected[i]).to.equal(current[i])
    }
  })

})
// 
// describe('homepage', () => {
//   it('should repond GET', (done) => {
//     superagent
//       .get('http://localhost:3001')
//       .end((err, res) => {
//         expect(res.status).to.equal(200)
//         done()
//       })
//   })
// })
