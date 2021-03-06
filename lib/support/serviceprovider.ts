import Edmunds from '../edmunds'

/**
 * Service provider abstract class
 */
export default abstract class ServiceProvider {
  /**
   * Current Edmunds this service provider is registered to
   */
  protected edmunds: Edmunds

  /**
   * Constructor
   * @param {Edmunds} app
   */
  constructor (app: Edmunds) {
    this.edmunds = app
  }

  /**
   * Register the service provider
   */
  abstract register (): void
}
