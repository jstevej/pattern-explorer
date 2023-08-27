import { Col, Form, Row } from 'solid-bootstrap';
import { Component, For } from 'solid-js';

type FormCheckboxEvent = { currentTarget: { checked: boolean } };
type FormValueEvent = { currentTarget: { value: string } };

export interface SFormCheckboxProps {
    default: boolean;
    id: string;
    label: string;
    update: (value: boolean) => void;
}

export interface SFormNumberProps {
    default: number;
    id: string;
    label: string;
    max: number;
    min: number;
    step: number;
    update: (value: number) => void;
}

export interface SFormSelectOption {
    id: string;
    label: string;
}

export interface SFormSelectProps {
    default?: string;
    id: string;
    label: string;
    options: Array<SFormSelectOption>;
    update: (value: string) => void;
}

export const SForm = Form;

export const SFormCheckbox: Component<SFormCheckboxProps> = props => {
    const updateBoolean = (event: FormCheckboxEvent) => {
        props.update(event.currentTarget.checked);
    };

    return (
        <Form.Group as={Row} controlId={props.id}>
            <Form.Label class="text-nowrap" column>
                {props.label}
            </Form.Label>
            <Col>
                <Form.Check
                    type="checkbox"
                    checked={props.default}
                    onChange={updateBoolean}
                ></Form.Check>
            </Col>
        </Form.Group>
    );
};

export const SFormNumber: Component<SFormNumberProps> = props => {
    const updateNumber = (event: FormValueEvent) => {
        const value = parseFloat(event.currentTarget.value);
        if (!Number.isNaN(value)) props.update(value);
    };

    return (
        <Form.Group as={Row} controlId={props.id}>
            <Form.Label class="text-nowrap" column>
                {props.label}
            </Form.Label>
            <Col>
                <Form.Control
                    type="number"
                    max={props.max}
                    min={props.min}
                    step={props.step}
                    value={props.default}
                    onChange={updateNumber}
                />
            </Col>
        </Form.Group>
    );
};

export const SFormSelect: Component<SFormSelectProps> = props => {
    const defaultValue = props.default ?? props.options[0].id;
    const updateGroup = (event: FormValueEvent) => {
        props.update(event.currentTarget.value);
    };

    return (
        <Form.Group as={Row} controlId={props.id}>
            <Form.Label class="text-nowrap" column>
                {props.label}
            </Form.Label>
            <Col>
                <Form.Select value={defaultValue} onChange={updateGroup}>
                    <For each={props.options}>
                        {(option, i) => <option value={option.id}>{option.label}</option>}
                    </For>
                </Form.Select>
            </Col>
        </Form.Group>
    );
};
