---
title: KubeJS 物品与绑定
---

# KubeJS 物品与绑定

```js
// kubejs/startup_scripts/mxt_items.js
StartupEvents.registry('item', event => {
  event.create('jade_token').displayName('玉令')
})
```

随后在数据包中用 `item_binding`、`weapon_binding` 或 `pill_binding` 匹配 `example:jade_token`。KubeJS 负责注册物品，MiXianTu 负责行为、条件、灵气、货币和 Tooltip。功法是例外：`technique_binding` 现在按功法 id 描述一门功法**怎么读**，而"这一叠教哪门功法"写在堆上的 `mxt:technique` 组件里——用 `carrier_item` 声明你要当手册的那件物品，再从创造模式物品栏或 `/picker mxt:technique` 取本体生成好的载体即可。

```js
// kubejs/server_scripts/mxt_reload_notice.js
ServerEvents.loaded(event => {
  console.log('MiXianTu 数据包已加载，使用 /mxt registries validate 检查注册表')
})
```
