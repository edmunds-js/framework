import { Edmunds } from '../../edmunds'
import { CacheManager } from '../cachemanager'
import FirebaseRealtimeDatabase from './firebaserealtimedatabase'
import { expect } from 'chai'
import * as appRootPath from 'app-root-path'
import * as sinon from 'sinon'
import 'mocha'

describe('FirebaseRealtimeDatabase', () => {
  it('should have FirebaseRealtimeDatabase with admin-config', () => {
    const config = [{
      name: 'firebaserealtimedatabase1',
      driver: 'firebaserealtimedatabase'
    }]

    const edmunds = new Edmunds(appRootPath.path)
    const manager = new CacheManager(edmunds, config)

    expect(() => manager.get()).to.throw('Can\'t determine Firebase Database URL.')
  })

  it('should have FirebaseRealtimeDatabase with custom-config', () => {
    const config = [{
      name: 'firebaserealtimedatabase2',
      driver: 'firebaserealtimedatabase',
      databaseURL: `https://totally-non-exisiting-project-${Math.round(Math.random() * 1000000)}.firebaseio.com`
    }]

    const edmunds = new Edmunds(appRootPath.path)
    const manager = new CacheManager(edmunds, config)

    const driver = manager.get()
    expect(driver).instanceof(FirebaseRealtimeDatabase)
  })

  it('should have a working get', async () => {
    const config = [{
      name: 'firebaserealtimedatabase3',
      driver: 'firebaserealtimedatabase',
      databaseURL: `https://totally-non-exisiting-project-${Math.round(Math.random() * 1000000)}.firebaseio.com`
    }]

    const edmunds = new Edmunds(appRootPath.path)
    const manager = new CacheManager(edmunds, config)

    const driver = manager.get()
    expect(driver).instanceof(FirebaseRealtimeDatabase)

    function createSnapshot (key: string, exists: boolean, value: any, lifetime: number) {
      return {
        key,
        exists: () => exists,
        val: () => {
          return {
            validUntil: (Date.now() / 1000) + lifetime,
            value
          }
        }
      }
    }
    const getStub = sinon.stub()
    getStub.onFirstCall().returns(createSnapshot('firstKey', true, 'firstValue', 10))
    getStub.onSecondCall().returns(createSnapshot('secondKey', true, 'secondValue', -10))
    getStub.onThirdCall().returns(createSnapshot('thirdValue', false, 'thirdValue', 10))
    const delStub = sinon.stub().resolves(undefined)
    const childStub = sinon.stub((driver as FirebaseRealtimeDatabase).database, 'child')
    childStub.withArgs('firstKey').returns({ once: getStub, remove: delStub })
    childStub.withArgs('secondKey').returns({ once: getStub, remove: delStub })
    childStub.withArgs('thirdKey').returns({ once: getStub, remove: delStub })
    childStub.returns(undefined)

    expect(getStub.notCalled).equals(true)

    // First call
    let result = await driver.get('firstKey')
    expect(getStub.calledOnce).equals(true)
    expect(delStub.notCalled).equals(true)
    expect(result).equals('firstValue')

    // Second call
    result = await driver.get('secondKey')
    expect(getStub.calledTwice).equals(true)
    expect(delStub.calledOnce).equals(true)
    expect(result).to.be.a('undefined')

    // Third call
    result = await driver.get('thirdKey')
    expect(getStub.calledThrice).equals(true)
    expect(delStub.calledOnce).equals(true)
    expect(result).to.be.a('undefined')

    expect(() => driver.del('fourthKey')).to.throw("Cannot read property 'remove' of undefined")
  })

  it('should have a working set', async () => {
    const config = [{
      name: 'firebaserealtimedatabase4',
      driver: 'firebaserealtimedatabase',
      databaseURL: `https://totally-non-exisiting-project-${Math.round(Math.random() * 1000000)}.firebaseio.com`
    }]

    const edmunds = new Edmunds(appRootPath.path)
    const manager = new CacheManager(edmunds, config)

    const driver = manager.get()
    expect(driver).instanceof(FirebaseRealtimeDatabase)

    let givenValue: any = undefined
    const childStub = sinon.stub((driver as FirebaseRealtimeDatabase).database, 'child')
    childStub.withArgs('firstKey').returns({
      set: async (value: any) => {
        givenValue = value
      }
    })
    childStub.returns(undefined)

    await driver.set('firstKey', 'firstValue', 100)
    expect(givenValue).to.deep.equal({
      value: 'firstValue',
      validUntil: Math.round(Date.now() / 1000) + 100
    })
    expect(() => driver.del('secondKey')).to.throw("Cannot read property 'remove' of undefined")
  })

  it('should have a working del', async () => {
    const config = [{
      name: 'firebaserealtimedatabase5',
      driver: 'firebaserealtimedatabase',
      databaseURL: `https://totally-non-exisiting-project-${Math.round(Math.random() * 1000000)}.firebaseio.com`
    }]

    const edmunds = new Edmunds(appRootPath.path)
    const manager = new CacheManager(edmunds, config)

    const driver = manager.get()
    expect(driver).instanceof(FirebaseRealtimeDatabase)

    const delStub = sinon.stub().returns(undefined)

    const childStub = sinon.stub((driver as FirebaseRealtimeDatabase).database, 'child')
    childStub.withArgs('firstKey').returns({ remove: delStub })
    childStub.returns(undefined)

    await driver.del('firstKey')
    expect(() => driver.del('secondKey')).to.throw("Cannot read property 'remove' of undefined")
  })

})
