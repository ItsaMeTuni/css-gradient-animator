# CSS Gradient Animator

This small JS library creates a CSS animation that interpolates between gradients.

[Demo](https://itsametuni.github.io/css-gradient-animator)

## Quick start
```
git clone https://github.com/ItsaMeTuni/css-gradient-animator.git

cd css-gradient-animator/

npm install

node ./gradientAnimator.js --name anim --gradients 0% "linear-gradient(0deg, #ffffff 0%, #000000 100%)" 100% "linear-gradient(90deg, #000000 0%, #ffffff 100%)"
```

(I intend to turn this into an executable npm module later, I just couldn't be bothered to do it yet)

And in your CSS file
```
@import url('./anim.css') /* This is the path to the file Gradient Animator generated. */

.animated-gradient
{
    animation: anim 1s infinite alternate;
}
```

## _Kinda_ how it works

If you give Gradient Animator these arguments 
```
--name anim --gradients 0% "linear-gradient(0deg, #ffffff 0%, #000000 100%)" 100% "linear-gradient(90deg, #000000 0%, #ffffff 100%)" --fps 4 --resolution 4
```
the output will be

```
@keyframes anim 
{
    0.00%
    {
        background-image: linear-gradient(0.00deg, #ffffff 0.00%, #bfbfbf 25.00%, #808080 50.00%, #404040 75.00%, #000000 100.00%);
    }
    25.00%
    {
        background-image: linear-gradient(22.50deg, #bfbfbf 0.00%, #9f9f9f 25.00%, #808080 50.00%, #606060 75.00%, #404040 100.00%);
    }
    50.00%
    {
        background-image: linear-gradient(45.00deg, #808080 0.00%, #808080 25.00%, #808080 50.00%, #808080 75.00%, #808080 100.00%);
    }
    75.00%
    {
        background-image: linear-gradient(67.50deg, #404040 0.00%, #606060 25.00%, #808080 50.00%, #9f9f9f 75.00%, #bfbfbf 100.00%);
    }
    100.00%
    {
        background-image: linear-gradient(90.00deg, #000000 0.00%, #404040 25.00%, #808080 50.00%, #bfbfbf 75.00%, #ffffff 100.00%);
    }
}
```

This works by each frame of the animation setting the gradient on the element. As you can see here this animation has few keyframes and if it's played for the duration of 1 second it's going to look very laggy. I reduced fps and resolution for easier visualization, but with an fps higher than 24 the animation will appear smooth.

## It's like making a gradient of gradients

You might have noticed that when specifying the gradients command-line argument there are percentages followed by a gradient

```
--gradients 0% "linear-gradient(0deg, #ffffff 0%, #000000 100%)" 100% "linear-gradient(90deg, #000000 0%, #ffffff 100%)"
```

This is used to control where _(when?)_ in the animation the gradient is. It behaves the same as the color paremeters in regular gradients, they have a position. It's like making a gradient of gradients.

```
--gradients 0% "linear-gradient(0deg, #ffffff 0%, #000000 100%)" 40% "linear-gradient(0deg, #ff0000 0%, #0000ff 100%)" 100% "linear-gradient(0deg, #000000 0%, #ffffff 100%)"
```
This will generate an animation that goes from white-to-black to red-to-blue in 40% of the time and then goes from red-to-blue to black-to-white in the remaining 60% of the time.

## The other parameters

### `--name`
Specify a name for the animation and for it's generated CSS file.
Required.

### `--duration`
How many seconds the animation will last. This is used to calculate the total amount of keyframes in the animation.
Optional.
Defaults to 1.

### `--fps`
How many frames per second should the animation be. This is used to calculate the total amount of keyframes in the animation.
Changing this is not reccommended since a value lower than 24 will give the animation a laggy feel to it and increasing this value can generate considerably larger outputs.
Optional.
Defaults to 24.

### `--resolution`
This specifies the 'resolution' of the gradients. Before the Gradient Animator can generate the gradients it must first convert them to have the same amount of points in the same locations, so that it can then interpolate between the gradients. This might result in a distortion of the gradient. If the gradient distorts/has the wrong colors you should increase the resolution. Keep in mind this will generate bigger, heavier animations.
Optional.
Defaults to 8.
