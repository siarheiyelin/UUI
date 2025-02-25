import { AttachmentBlock } from './AttachmentBlock';
import { getBlockAboveByType } from '../../utils/getAboveBlock';
import { PARAGRAPH_TYPE } from '../paragraphPlugin/paragraphPlugin';
import { createPluginFactory, insertEmptyElement } from '@udecode/plate-common';
import { IHasToolbarButton } from "../../implementation/Toolbars";
import { AttachFileButton } from "./AttachFileButton";

export const ATTACHMENT_PLUGIN_KEY = 'attachment';
export const ATTACHMENT_PLUGIN_TYPE = 'attachment';

export const attachmentPlugin = () => {
    const createAttachmentPlugin = createPluginFactory<IHasToolbarButton>({
        key: ATTACHMENT_PLUGIN_KEY,
        type: ATTACHMENT_PLUGIN_TYPE,
        isElement: true,
        isVoid: true,
        handlers: {
            onKeyDown: (editor) => (event) => {
                if (!getBlockAboveByType(editor, ['attachment'])) return;

                if (event.key === 'Enter') {
                    return insertEmptyElement(editor, PARAGRAPH_TYPE);
                }
            },
        },
        component: AttachmentBlock,
        options: {
            bottomBarButton: AttachFileButton,
        },
    });

    return createAttachmentPlugin();
};
