const colorInterp = require('color-interpolate');
const rgbHex = require('rgb-hex');
const scaleRange = require('scale-number-range');
const lerp = require('lerp');
const fs = require('fs');

if(require.main === module)
{
    //Command-line
    const args = parseCommandLineArgs();
    const anim = generateAnimation(args);


    fs.writeFileSync(process.cwd() + '/' + args.animationName + '.css', anim);
}
else
{
    //Required module
}

function generateAnimation(options)
{
    let {gradients, animationName, keyframeCount, gradientResolution, duration, fps} = options;

    if(keyframeCount == null)
    {
        keyframeCount = Math.floor(duration * fps);
    }

    gradients = gradients.map(x => 
    {
        return {
            pos: parseInt(x.pos.substring(0, x.pos.length - 1)),
            gradient: parseCssGradient(x.gradient),
        }
    });

    //We first equalize all gradients so they have the same number
    //of points at the same percentages.
    //Take a loook at equalizeGradients for more information.
    const equalizedGradients = equalizeGradients(gradients, gradientResolution);

    const animation = [];

    //keyframe
    //  get closest smaller pos and closest biggest pos
    //  get normalized position of keyframe relative to closest positions
    //  generate interpolated gradient with this normalized position

    for(let i = 0; i < keyframeCount + 1; i++)
    {
        const percentage = (100 / keyframeCount) * i;

        const {small: leftGrad, big: rightGrad} = getNearestPositions(equalizedGradients, percentage);

        //Normalize percentage between leftGrad pos and rightGrad pos
        //E.g.: leftGrad.pos = 50, rightGrad.pos = 60, percentage = 55, normalizedPercentageBetweenGrads = .5
        //This will allow us to get the interpolated gradient between leftGrad and rightGrad for this keyframe
        const normalizedPercentageBetweenGrads = scaleRange(percentage, leftGrad.pos, rightGrad.pos, 0, 1);

        const interpolatedGradient = lerpGradient(leftGrad.gradient, rightGrad.gradient, normalizedPercentageBetweenGrads, gradientResolution);

        const keyframe = {
            pos: percentage,
            gradient: interpolatedGradient,
        }

        animation.push(keyframe);
    }

    return toCssAnimation(animation, animationName);
}

/**
 * Makes all gradients have colors at the same positions based on the gradientResolution
 * so we can interpolate between them later.
 * Example: (I wrote the gradients like gradient(black 0%... so that it's easier to understand the example)
 * gradients: [gradient(black 0%, white 100%), gradient(blue 0%, red 100%)]
 * gradientResolution: 2
 * returned value: [gradient(black 0%, 50% grey, white 100%), gradient(blue 0%, purple 50%, red 100%)]
 * @param {*} gradients Array of gradient objects
 * @param {*} gradientResolution 
 */
function equalizeGradients(gradients, gradientResolution)
{
    const equalizedGradients = [];

    for(const gradPos of gradients)
    {
        const grad = gradPos.gradient;

        const newGrad = {
            angle: grad.angle,
            colors: []
        };

        for(let i = 0; i < gradientResolution + 1; i++)
        {
            const percentage = (100 / gradientResolution) * i;

            let closestSmallestGColor = grad.colors[0];
            let closestSmallestDist = Math.abs(percentage - closestSmallestGColor.pos);
            let closestBiggestGColor = grad.colors[grad.colors.length - 1];
            let closestBiggestDist = Math.abs(percentage - closestBiggestGColor.pos);
            for(const gColor of grad.colors)
            {
                const dist = Math.abs(percentage - gColor.pos);
                if(dist < closestSmallestDist && gColor.pos <= percentage)
                {
                    closestSmallestGColor = gColor;
                    closestSmallestDist = dist;
                }
                else if(dist < closestBiggestDist && gColor.pos > percentage)
                {
                    closestBiggestGColor = gColor;
                    closestBiggestDist = dist;
                }
            }


            if(percentage == 100)
            {
                newGrad.colors.push({
                    color: closestBiggestGColor.color, //doesn't matter if closestBiggestGColor or closestSmallestGColor, both will be the same gColor
                    pos: 100,
                });
            }
            else
            {
                const normalizedRelativePercentage = scaleRange(percentage, closestSmallestGColor.pos, closestBiggestGColor.pos, 0, 1);
                const pallette = colorInterp([closestSmallestGColor.color, closestBiggestGColor.color]);
                newGrad.colors.push({
                    color: '#' + rgbHex(pallette(normalizedRelativePercentage)),
                    pos: percentage,
                });
            }
        }

        equalizedGradients.push({
            pos: gradPos.pos,
            gradient: newGrad,
        });
    }

    return equalizedGradients;
}

/**
 * Lerps from A to B at time T with the gradient resolution provided.
 * @param {*} a 
 * @param {*} b 
 * @param {*} t 
 * @param {*} gradientResolution 
 */
function lerpGradient(a, b, t, gradientResolution)
{
    const interpolatedGradient = {
        angle: lerp(a.angle, b.angle, t),
        colors: [],
    }

    //gradientTransformResolution + 1 because a resolution of 8 gives 9 elements
    //(the zero element + the ones we generated in the loop)
    for(let ci = 0; ci < gradientResolution + 1; ci++)
    {
        const pos = (100 / gradientResolution) * ci;

        const pallette = colorInterp([a.colors[ci].color, b.colors[ci].color]);
        const color = '#' + rgbHex(pallette(t));

        const gColor = {
            color,
            pos,
        };

        interpolatedGradient.colors.push(gColor);
    }

    return interpolatedGradient;
}

/**
 * Finds the two objects with the nearest pos values
 * around the pos parameter.
 * Note: the elements in the objects parameter have to be sorted
 * so that their order is from smallest pos to biggest pos
 * Say we have an array of objects like
 * [{pos: 0}, {pos: 25}, {pos: 50}, {pos: 75}, {pos: 100}]
 * and the pos parameter is 48 the return value will be
 * {small: {pos: 25}, big: {pos: 50}}
 * @param {[{pos: Number}]} objects 
 */
function getNearestPositions(objects, pos)
{
    let smallestObj = objects[0];
    let smallestDist = Math.abs(pos - smallestObj.pos);
    let biggestObj = objects[objects.length - 1];
    let biggestDist = Math.abs(pos - biggestObj.pos);
    for(const obj of objects)
    {
        const dist = Math.abs(pos - obj.pos);
        if(dist < smallestDist && obj.pos <= pos && obj.pos < biggestObj.pos)
        {
            smallestObj = obj;
            smallestDist = dist;
        }
        else if(dist < biggestDist && obj.pos > pos)
        {
            biggestObj = obj;
            biggestDist = dist;
        }
    }

    return {
        small: smallestObj,
        big: biggestObj,
    };
}

function toCssGradient(grad)
{
    let str = 'linear-gradient(' + grad.angle.toFixed(2) + 'deg, ';

    for(const gColor of grad.colors)
    {
        str += gColor.color + ' ' + gColor.pos.toFixed(2) + '%, ';
    }

    str = str.substr(0, str.length - 2); //remove last comma and space

    return str + ')';
}

function toCssAnimation(anim, name)
{
    let str = `@keyframes ${name} \n{\n`;

    for(const keyframe of anim)
    {
        str += '    ' + keyframe.pos.toFixed(2) + '%\n    {\n';
        str += '        background-image: ' + toCssGradient(keyframe.gradient) + ';\n    }\n'
    }
    str += '}'

    return str;
}

function parseCssGradient(str)
{
    const regex = /linear-gradient\((.*)deg,(.*)\)/;
    const results = regex.exec(str);

    const gradient = {
        angle: results[1] ? parseFloat(results[1]) : 0,
        colors: [],
    };

    const gColors = results[2].split(',');
    for(const gColor of gColors)
    {
        const components = gColor.split(' ');

        gradient.colors.push({
            color: components[1],
            pos: parseFloat(components[2].substr(0, components[1].length - 2)),
        });
    }

    return gradient;
}

function parseCommandLineArgs()
{
    const args = process.argv.slice(2, process.argv.length);

    const argData = [];

    for(const arg of args)
    {
        if(arg[0] == '-' && arg[1] == '-')
        {
            argData.push({arg, params: []});
        }
        else
        {
            argData[argData.length - 1].params.push(arg);
        }
    }

    const defSingleArg = function(name)
    {
        const arg = argData.find(x => x.arg == name);
        if(arg)
        {
            return arg.params[0];
        }
        else
        {
            return null;
        }
    }

    const retVal = {
        animationName: defSingleArg('--name') || '',
        gradients: [],
        duration: parseInt(defSingleArg('--duration')) || 1,
        fps: parseInt(defSingleArg('--fps')) || 24,
        gradientResolution: parseInt(defSingleArg('--resolution')) || 8,
    }

    //Gradient params are position-gradient pairs
    //E.g.:
    //0% linear-gradient(...) 100% linear-gradient(...)
    //Is two gradients, one at position 0 in the animation
    //and the other at position 100 in the animation
    const gradientsArg = argData.find(x => x.arg == '--gradients');
    if(gradientsArg)
    {
        for(let i = 0; i < gradientsArg.params.length; i++)
        {
            const param = gradientsArg.params[i];
            if(!(i % 2))
            {
                retVal.gradients.push({
                    pos: param,
                });
            }
            else
            {
                retVal.gradients[retVal.gradients.length - 1].gradient = param;
            }            
        }
    }

    return retVal;
}

module.exports.generateAnimation = generateAnimation;