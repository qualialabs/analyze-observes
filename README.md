# Analyze Observes

This package helps you find and fix publications/observes that are using the polling driver, rather than the oplog driver.

## Installation

```sh
$ meteor add qualia:analyze-observes
```

## Usage

```js
import { Analyze } from 'meteor/qualia:analyze-observes';
console.log(Analyze.go());
```
