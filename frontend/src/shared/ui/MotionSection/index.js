'use client';

import {motion} from 'framer-motion';

const defaultVariants = {
  hidden: {opacity: 0, y: 32},
  visible: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.7, ease: [0.22, 1, 0.36, 1]},
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

export const MotionItem = ({
  children,
  className,
  variants = defaultVariants,
  ...rest
}) => (
  <motion.div className={className} variants={variants} {...rest}>
    {children}
  </motion.div>
);

const MotionSection = ({
  children,
  className,
  as: Component = motion.section,
  amount = 0.2,
  once = true,
  stagger = false,
  ...rest
}) => {
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{once, amount}}
      variants={stagger ? staggerContainer : defaultVariants}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default MotionSection;
