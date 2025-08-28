// External
import { useState } from 'react';

// Internal
import { TextField, TextFieldProps } from './TextField.tsx';
import Icon from './Icon.tsx';
import Button from './Button.tsx';
import visibleIcon from '../icons/visible.svg';
import invisibleIcon from '../icons/invisible.svg';

export default function MaskableTextField(props: TextFieldProps) {
    const [unmasked, setUnmasked] = useState(false);

    const toggleUnmasked = () => {
        setUnmasked(!unmasked);
    };
    const maskableProps = {
        type: unmasked ? 'text' : 'password',
        right: (
            <Button skin="plain" onClick={toggleUnmasked} tabIndex={-1}>
                <img
                    src={unmasked ? visibleIcon : invisibleIcon}
                    alt={unmasked ? "Hide" : "Show"}
                    style={{ width: '1.5em', height: '1.5em' }}
                />
            </Button>        ),
    };

    return <TextField {...props} {...maskableProps} />;
}
