import * as firebaseFunctions from 'firebase-functions'
import * as firebaseAdmin from 'firebase-admin'
import { isUndefined } from 'util'

/**
 * Caching class using Firebase Realtime Database
 */
export class FirebaseRealtimeDatabase {
  /**
   * Database reference
   */
  database: firebaseAdmin.database.Reference

  /**
   * Constructor
   * @param {string} name
   * @param {string} ref
   * @param {admin.AppOptions} config
   */
  constructor (name: string, ref: string, config?: firebaseAdmin.AppOptions) {
    if (isUndefined(config)) {
      config = firebaseFunctions.config().firebase
    }

    const admin = firebaseAdmin.initializeApp(config, name)
    this.database = admin.database().ref(ref)
  }

  /**
   * Set value in the cache
   * @param {string} key
   * @param data
   * @param {number} lifetime
   * @return {Promise<void>}
   */
  set (key: string, data: any, lifetime: number): Promise<void> {
    const ref = this.database.child(key)
    const snapshotValue: SnapshotValue = {
      validUntil: lifetime === 0 ? 0 : Math.round(Date.now() / 1000) + lifetime,
      value: data
    }

    return ref.set(snapshotValue)
  }

  /**
   * Get the value from cache
   * @param {string} key
   * @return {Promise<any>}
   */
  async get (key: string): Promise<any> {
    const ref = this.database.child(key)

    const snapshot: firebaseAdmin.database.DataSnapshot = await ref.once('value')

    if (this.isSnapshotValid(snapshot)) {
      return (snapshot.val() as SnapshotValue).value
    }

    // Snapshot is not valid but exists. So delete it.
    if (snapshot.exists()) {
      await this.del(key)
    }

    return undefined
  }

  /**
   * Delete the value from cache
   * @param {string} key
   * @return {Promise<void>}
   */
  del (key: string): Promise<void> {
    const ref = this.database.child(key)
    return ref.remove()
  }

  /**
   * Check if snapshot is valid
   * @param {admin.database.DataSnapshot} snapshot
   * @return {boolean}
   */
  protected isSnapshotValid (snapshot: firebaseAdmin.database.DataSnapshot): boolean {
    if (!snapshot.exists()) {
      return false
    }

    const validUntil = (snapshot.val() as SnapshotValue).validUntil
    return !validUntil || Math.floor(Date.now() / 1000) < validUntil
  }
}

/**
 * Interface for the snapshot value
 */
interface SnapshotValue {
  validUntil: number
  value: any
}
