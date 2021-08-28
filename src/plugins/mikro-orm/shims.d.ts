declare module 'class-fixtures-factory' {
  interface FactoryOptions {
    /**
     * If `true`, primary key columns will be generated with a value instead
     * of undefined.
     *
     * False by default.
     */
    handlePrimaryColumns?: boolean;
  }
}
