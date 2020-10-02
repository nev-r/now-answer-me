# now-answer-me
the goal is to make a simple discord bot possible in about  
as much time as it takes to type `npm install nev-r/now-answer-me`

```js
import { addCommand, init } from "now-answer-me";

addCommand({ command: "hello", response: 'hi!' });

init("smIcXn83zPK.MY.DISCORD.API.TOKEN.l898HA5E");
```

![image](https://user-images.githubusercontent.com/68782081/90107344-81c17f80-dcfd-11ea-947e-d1c8d6f19d20.png)

<hr/>

instead of a string, `command` can be multiple strings which will activate the same command  
instead of a string, `response` can be a function which returns a response
```js
addCommand({ command: ["echo", "echothis"], response: echoSomething });

function echoSomething({args}) {
  if (args) return args;
  else return "you didn't give me anything to repeat!";
}
```

![image](https://user-images.githubusercontent.com/68782081/90107335-7ec68f00-dcfd-11ea-859f-292873796362.png)

<hr/>

a `response` function receives data about the trigger. for the power user, instead of returning a value,
and the code can just deal with the discord.js `Message` object directly
```js
addCommand({ command: "tattle", response: tattleOnUser });

function tattleOnUser({msg, args, command, content}) {
  const text = `i was sent "${args}" by ${msg.author}!`;
  msg.channel.send(text);
}
```

![image](https://user-images.githubusercontent.com/68782081/90107315-7706ea80-dcfd-11ea-9a3b-1fb95c126120.png)

<hr/>

set your command prefix, and a set up status message
```js
import { setPrefix } from "now-answer-me";

setPrefix('&&&&&');

addActivity(
	{ name: 'in the fall leaves 🍃', options: { type: 'PLAYING' } }
);
```

![image](https://user-images.githubusercontent.com/68782081/90108928-dd8d0800-dcff-11ea-9ca8-fe19f31594d6.png) ![image](https://user-images.githubusercontent.com/68782081/90109372-92bfc000-dd00-11ea-81e9-2875185b14cd.png)