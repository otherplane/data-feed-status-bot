import { groupBy } from '../src/groupBy.js'

describe('groupBy', () => {
  it('creates an object grouping the array elements by the specified key', () => {
    const feeds = [
      {
        heartbeat: '1000',
        finality: '1',
        feedFullName: 'feedFullname1',
        lastResultTimestamp: '1000',
        address: 'address1',
        lastResult: '1',
        name: 'name1',
        network: 'network1'
      },
      {
        heartbeat: '1000',
        finality: '1',
        feedFullName: 'feedFullname2',
        lastResultTimestamp: '1000',
        address: 'address1',
        lastResult: '1',
        name: 'name1',
        network: 'network1'
      },
      {
        heartbeat: '1000',
        finality: '1',
        feedFullName: 'feedFullname3',
        lastResultTimestamp: '1638461382000',
        address: 'address2',
        lastResult: '2',
        name: 'name2',
        network: 'network2'
      },
      {
        heartbeat: '1000',
        finality: '1',
        feedFullName: 'feedFullname4',
        lastResultTimestamp: '1638461382000',
        address: 'address2',
        lastResult: '2',
        name: 'name2',
        network: 'network3'
      },
      {
        heartbeat: '1000',
        finality: '1',
        feedFullName: 'feedFullname5',
        lastResultTimestamp: '1638461382000',
        address: 'address2',
        lastResult: '2',
        name: 'name2',
        network: 'network3'
      }
    ]

    const result = {
      network1: [
        {
          heartbeat: '1000',
          finality: '1',
          feedFullName: 'feedFullname1',
          lastResultTimestamp: '1000',
          address: 'address1',
          lastResult: '1',
          name: 'name1',
          network: 'network1'
        },
        {
          heartbeat: '1000',
          finality: '1',
          feedFullName: 'feedFullname2',
          lastResultTimestamp: '1000',
          address: 'address1',
          lastResult: '1',
          name: 'name1',
          network: 'network1'
        }
      ],
      network2: [
        {
          heartbeat: '1000',
          finality: '1',
          feedFullName: 'feedFullname3',
          lastResultTimestamp: '1638461382000',
          address: 'address2',
          lastResult: '2',
          name: 'name2',
          network: 'network2'
        }
      ],
      network3: [
        {
          heartbeat: '1000',
          finality: '1',
          feedFullName: 'feedFullname4',
          lastResultTimestamp: '1638461382000',
          address: 'address2',
          lastResult: '2',
          name: 'name2',
          network: 'network3'
        },
        {
          heartbeat: '1000',
          finality: '1',
          feedFullName: 'feedFullname5',
          lastResultTimestamp: '1638461382000',
          address: 'address2',
          lastResult: '2',
          name: 'name2',
          network: 'network3'
        }
      ]
    }

    expect(groupBy(feeds, 'network')).toStrictEqual(result)
  })
})
