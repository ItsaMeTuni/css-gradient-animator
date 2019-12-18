const colorInterp = require('color-interpolate');
const rgbHex = require('rgb-hex');
const scaleRange = require('scale-number-range');
const lerp = require('lerp');
const util = require('util');

const gradients = [
    {
        angle: 30,
        colors: [
            {color: '#3d3393', pos: 0},
            {color: '#2b76b9', pos: 37},
            {color: '#2cacd1', pos: 65},
            {color: '#35eb93', pos: 100},
        ],
    },
    {
        angle: 20, 
        colors: [
            {color: '#6e45e2', pos: 0},
            {color: '#88d3ce', pos: 100},
        ],
    },
]

const gradientTransformResolution = 8;


const equalizedGradients = [];

for(const grad of gradients)
{
    const newGrad = {
        angle: grad.angle,
        colors: [
            {color: grad.colors.find(x => x.pos == 0).color, pos: 0},
        ]
    };

    for(let i = 0; i < gradientTransformResolution; i++)
    {
        const percentage = (100 / gradientTransformResolution) * (i + 1);

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

    equalizedGradients.push(newGrad);
}


//You should aim for 24fps
//Calculate your keyframe count like 24 * animDurationInSeconds
const keyframeCount = 24;
const animation = [];

const grad1 = equalizedGradients[0];
const grad2 = equalizedGradients[1];

for(let i = 0; i < keyframeCount + 1; i++)
{
    const percentage = (100 / keyframeCount) * (i + 0);

    const interpolatedGradient = {
        angle: lerp(grad1.angle, grad2.angle, percentage / 100),
        colors: [],
    }

    //gradientTransformResolution + 1 because a resolution of 8 gives 9 elements
    //(the zero element + the ones we generated in the loop)
    for(let ci = 0; ci < gradientTransformResolution; ci++)
    {
        const pos = (100 / gradientTransformResolution) * (ci + 1);

        const pallette = colorInterp([grad1.colors[ci].color, grad2.colors[ci].color]);
        const color = '#' + rgbHex(pallette(percentage / 100));

        const gColor = {
            color,
            pos,
        };

        interpolatedGradient.colors.push(gColor);
    }

    const keyframe = {
        pos: percentage,
        gradient: interpolatedGradient,
    }

    animation.push(keyframe);
}

console.log(toCssAnimation(animation, 'grad'));

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